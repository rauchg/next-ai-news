import { z } from "zod";
import { OpenAI } from "openai";
import { ZodFunctionDef, toTool } from "openai-zod-functions";
import type { NextRequest } from "next/server";
import psl from "psl";
import {
  db,
  storiesTable,
  commentsTable,
  genStoryId,
  genCommentId,
} from "@/app/db";
import { sql } from "drizzle-orm";

export const maxDuration = 120;

const ai = new OpenAI({
  baseURL: "https://api.endpoints.anyscale.com/v1",
  apiKey: process.env.ANYSCALE_API_KEY,
});

const StorySchema = z.object({
  title: z
    .string()
    .describe(
      "The title of the HN story. If it's a hiring story, it should be in the classic HN format"
    ),
  username: z.string().describe("The username of the author"),
  domain: z.string().describe("The domain of the story"),
  type: z.enum(["show", "jobs", "ask", "story"]).describe("The type of story"),
  points: z.number(),
});

const StoriesSchema = z.array(StorySchema);

type Story = z.infer<typeof StorySchema>;
type Stories = z.infer<typeof StoriesSchema>;

const CommentsSchema = z.array(
  z.object({
    id: z.string().describe("The numeric comment id. It should be numeric"),
    reply_to_id: z
      .string()
      .optional()
      .describe("The numeric id of the comment id this replies to"),
    username: z.string().describe("The username of the author"),
    comment: z.string().describe("The comment text"),
  })
);

type Comments = z.infer<typeof CommentsSchema>;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!process.env.CRON_SECRET && process.env.NODE_ENV !== "development") {
    return Response.json(
      { success: false, message: "Cron validation failed" },
      { status: 500 }
    );
  }

  if (
    process.env.NODE_ENV !== "development" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return Response.json({ success: false }, { status: 401 });
  }

  const { stories }: { stories: Stories } = await complete(
    `give me 5 hacker news (HN) stories. 

Follow the following instructions accurately:

- Make the titles as realistic as possible.
- If the story is in the first person and showing some work, prefix it with Show HN:
- If the story is a question, prefix it with Ask HN:
- If the story is about hiring, use the HN format for example '{Company} (YC {Season}) is hiring {Role}'. Replace the {} variables with creative values
- Most titles should not be in the first person, and should not be prefixed.
- NEVER include a prefix like "Prefix:" for jobs and hiring titles
- Only include at most 1 show, 1 ask and 1 hiring title
`,
    [
      {
        name: "get_stories",
        description: "Get stories from hacker news (HN)",
        schema: z.object({
          stories: StoriesSchema,
        }),
      },
    ]
  );

  const storiesWithIds: (Story & { id: string })[] = stories
    .map((story) => {
      return {
        ...story,
        id: genStoryId(),
        title: story.title.trim(),
        points: Math.max(1, story.points),
        username: story.username.toLowerCase().trim().replace(/\s/g, ""),
        domain: story.domain.toLowerCase().trim(),
      };
    })
    .filter((story) => {
      return isValidDomain(story.domain);
    });

  if (!storiesWithIds.length) {
    console.error("No stories returned");
    return Response.json({ success: false }, { status: 500 });
  }

  await db.insert(storiesTable).values(
    storiesWithIds.map((story) => {
      return {
        id: story.id,
        type: story.type,
        title: story.title,
        domain: story.domain,
        username: story.username,
        points: story.points,
      };
    })
  );

  console.log(
    "Inserted stories",
    storiesWithIds.map((story) => story.title).join(", ")
  );

  await Promise.all(
    storiesWithIds.map(async (story) => {
      try {
        const { comments }: { comments: Comments } = await complete(
          `Generate a hacker news comment tree with 100+ comments, replies and usernames for the topic: ${story.title}. Make the comments as realistic and comprehensive as possible`,
          [
            {
              name: "get_comments",
              description: "Get comments for a hacker news (HN) story",
              schema: z.object({
                comments: CommentsSchema,
              }),
            },
          ]
        );

        // skip comments with a repeated id
        const uniqueComments = comments.filter(
          (comment, index, self) =>
            self.findIndex((c) => c.id === comment.id) === index
        );

        const commentIdToUid: { [key: string]: string } = uniqueComments.reduce(
          (acc, comment) => {
            acc[comment.id] = genCommentId();
            return acc;
          },
          {} as { [key: string]: string }
        );

        if (uniqueComments.length) {
          // await db.transaction(async (tx) => {
          await db.insert(commentsTable).values(
            uniqueComments.map((comment) => {
              const uid = commentIdToUid[comment.id];

              return {
                id: uid,
                story_id: story.id,
                parent_id: commentIdToUid[comment.reply_to_id ?? ""] ?? null,
                username: comment.username
                  .toLowerCase()
                  .trim()
                  .replace(/\s/g, ""),
                comment: comment.comment.trim(),
              };
            })
          );

          await db
            .update(storiesTable)
            .set({
              comments_count: sql`${storiesTable.comments_count} + ${comments.length}`,
            })
            .where(sql`${storiesTable.id} = ${story.id}`);
          // });

          console.log(
            `Inserted ${comments.length} comments for story ${story.title}`
          );
        }
      } catch (e) {
        console.error("Failed to insert comments", e);
      }
    })
  );

  return Response.json({ success: true });
}

async function complete(prompt: string, functions: ZodFunctionDef[]) {
  const completions = await ai.chat.completions.create({
    model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
    // model: "accounts/fireworks/models/fw-function-call-34b-v0",
    // model: "gpt-3.5-turbo-1106",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that writes creative HN (Hacker News) story titles",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    tools: functions.map(toTool),
    temperature: 1,
    tool_choice: "auto",
  });

  if (!completions?.choices[0]?.message?.tool_calls?.length) {
    return [];
  }

  return JSON.parse(
    completions.choices[0].message.tool_calls[0].function.arguments
  );
}

function isValidDomain(domain: string) {
  const parsed = psl.parse(domain);
  return parsed.error === undefined && parsed.tld !== null;
}

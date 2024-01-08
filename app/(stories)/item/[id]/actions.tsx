"use server";

import z from "zod";
import {
  db,
  usersTable,
  storiesTable,
  commentsTable,
  genCommentId,
} from "@/app/db";
import { auth } from "@/app/auth";
import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { newCommentRateLimit } from "@/lib/rate-limit";

const ReplyActionSchema = z.object({
  storyId: z.string(),
  text: z.string().min(3).max(1000),
});

export type ReplyActionData = {
  commentId?: string;
  error?:
    | {
        code: "INTERNAL_ERROR";
        message: string;
      }
    | {
        code: "VALIDATION_ERROR";
        fieldErrors: {
          [field: string]: string[];
        };
      }
    | {
        code: "RATE_LIMIT_ERROR";
        message: string;
      }
    | {
        code: "AUTH_ERROR";
        message: string;
      };
};

export async function replyAction(
  _prevState: any,
  formData: FormData
): Promise<ReplyActionData | void> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: {
        code: "AUTH_ERROR",
        message: "You must be logged in to reply.",
      },
    };
  }

  const data = ReplyActionSchema.safeParse({
    storyId: formData.get("storyId"),
    text: formData.get("text"),
  });

  if (!data.success) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        fieldErrors: data.error.flatten().fieldErrors,
      },
    };
  }

  const user = (
    await db
      .select()
      .from(usersTable)
      .where(sql`${usersTable.id} = ${session.user.id}`)
      .limit(1)
  )[0];

  if (!user) {
    return {
      error: {
        code: "INTERNAL_ERROR",
        message: "User not found",
      },
    };
  }

  const rl = await newCommentRateLimit.limit(user.id);

  if (!rl.success) {
    return {
      error: {
        code: "RATE_LIMIT_ERROR",
        message: "Too many comments. Try again later",
      },
    };
  }

  // TODO: use transactions, but Neon doesn't support them yet
  // in the serverless http driver :raised-eyebrow:
  // await db.transaction(async (tx) => {
  const tx = db;
  try {
    const story = (
      await tx
        .select({
          id: storiesTable.id,
        })
        .from(storiesTable)
        .where(sql`${storiesTable.id} = ${data.data.storyId}`)
        .limit(1)
    )[0];

    if (!story) {
      throw new Error("Story not found");
    }

    await tx
      .update(storiesTable)
      .set({
        comments_count: sql`${storiesTable.comments_count} + 1`,
      })
      .where(sql`${storiesTable.id} = ${story.id}`);

    const commentId = genCommentId();

    await tx.insert(commentsTable).values({
      id: commentId,
      story_id: story.id,
      author: user.id,
      comment: data.data.text,
    });

    revalidatePath(`/items/${story.id}`);

    return {
      commentId,
    };
  } catch (err) {
    console.error(err);
    return {
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong",
      },
    };
  }
}

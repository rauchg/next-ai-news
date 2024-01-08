"use server";

import z from "zod";
import { db, storiesTable, genStoryId } from "@/app/db";
import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import { newStoryRateLimit } from "@/lib/rate-limit";

const SubmitActionSchema = z
  .object({
    title: z.string().min(3).max(80).trim(),
    text: z.string().max(5000).trim().optional(),
    url: z.string().trim().url().optional(),
  })
  .partial()
  .superRefine((data, ctx) => {
    if (!data?.text?.length && !data?.url?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either text or url is required",
        path: ["text", "url"],
      });
    }
  });

export type SubmitActionData = {
  error?:
    | {
        code: "INTERNAL_ERROR";
        message: string;
      }
    | {
        code: "AUTH_ERROR";
        message: string;
      }
    | {
        code: "VALIDATION_ERROR";
        fieldErrors: {
          [field: string]: string[];
        };
      };
};

export async function submitAction(
  _prevState: any,
  formData: FormData
): Promise<SubmitActionData | void> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const input = SubmitActionSchema.safeParse({
    title: formData.get("title"),
    // text and url are optional, but we get them
    // as empty strings,which throws zod off
    text: formData.get("text") || undefined,
    url: formData.get("url") || undefined,
  });

  if (!input.success) {
    const { fieldErrors } = input.error.flatten();
    return {
      error: {
        code: "VALIDATION_ERROR",
        fieldErrors,
      },
    };
  }

  const rl = await newStoryRateLimit.limit(userId);
  if (!rl.success) {
    return {
      error: {
        code: "AUTH_ERROR",
        message: "Too many attempts. Try again later",
      },
    };
  }

  // get hostname from url
  const id = genStoryId();

  try {
    await db.insert(storiesTable).values({
      id,
      type: getType(input.data.title as string),
      title: input.data.title as string,
      points: 1,
      domain: input.data.url
        ? new URL(input.data.url as string).hostname
        : null,
      submitted_by: userId,
    });
  } catch (e) {
    console.error(e);
    return {
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create. Please try again later",
      },
    };
  }

  redirect(`/item/${id.replace(/^story_/, "")}`);
}

function getType(title: string) {
  const lTitle = title.toLowerCase();
  if (lTitle.startsWith("ask hn")) {
    return "ask";
  } else if (lTitle.startsWith("show hn")) {
    return "show";
  } else {
    return "story";
  }
}

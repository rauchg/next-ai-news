"use server";

import { signOut } from "@/app/auth";
import z from "zod";
import { db, usersTable, storiesTable, votesTable, genVoteId } from "@/app/db";
import { auth } from "@/app/auth";
import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { unvoteRateLimit, voteRateLimit } from "@/lib/rate-limit";
import { redirect } from "next/navigation";

export async function signOutAction() {
  await signOut();
  return {};
}

const VoteActionSchema = z.object({
  storyId: z.string(),
});

export type VoteActionData = {
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
        code: "ALREADY_VOTED_ERROR";
        message: string;
      };
};

export async function voteAction(
  formData: FormData
): Promise<VoteActionData | void> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const data = VoteActionSchema.safeParse({
    storyId: formData.get("storyId"),
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

  const rl = await voteRateLimit.limit(user.id);

  if (!rl.success) {
    return {
      error: {
        code: "RATE_LIMIT_ERROR",
        message: "Too many votes. Try again later",
      },
    };
  }

  // TODO: transaction
  // await db.transaction(async (tx) => {
  const tx = db;
  try {
    const story = (
      await tx
        .select({
          id: storiesTable.id,
          username: storiesTable.username,
          submitted_by: storiesTable.submitted_by,
          vote_id: votesTable.id,
        })
        .from(storiesTable)
        .where(sql`${storiesTable.id} = ${data.data.storyId}`)
        .leftJoin(
          votesTable,
          sql`${storiesTable.id} = ${votesTable.story_id} AND ${votesTable.user_id} = ${user.id}`
        )
        .limit(1)
    )[0];

    if (!story) {
      throw new Error("Story not found");
    }

    if (story.vote_id) {
      return {
        error: {
          code: "ALREADY_VOTED_ERROR",
          message: "You already voted for this story",
        },
      };
    }

    await Promise.all([
      tx.insert(votesTable).values({
        id: genVoteId(),
        user_id: user.id,
        story_id: story.id,
      }),
      tx
        .update(storiesTable)
        .set({
          points: sql`${storiesTable.points} + 1`,
        })
        .where(sql`${storiesTable.id} = ${story.id}`),
      story.submitted_by
        ? tx
            .update(usersTable)
            .set({
              karma: sql`${usersTable.karma} + 1`,
            })
            .where(sql`${usersTable.id} = ${story.submitted_by}`)
        : Promise.resolve(),
    ]);

    // revalidate all data, including points for all stories
    revalidatePath("/", "layout");

    return {};
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

const UnvoteActionSchema = z.object({
  storyId: z.string(),
});

export type UnvoteActionData = {
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
        code: "SELF_UNVOTE_ERROR";
        message: string;
      };
};

export async function unvoteAction(
  formData: FormData
): Promise<UnvoteActionData | void> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const data = UnvoteActionSchema.safeParse({
    storyId: formData.get("storyId"),
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

  const rl = await unvoteRateLimit.limit(user.id);

  if (!rl.success) {
    return {
      error: {
        code: "RATE_LIMIT_ERROR",
        message: "Too many unvotes. Try again later",
      },
    };
  }

  // TODO: transaction
  // await db.transaction(async (tx) => {
  const tx = db;
  try {
    const story = (
      await tx
        .select({
          id: storiesTable.id,
          username: storiesTable.username,
          submitted_by: storiesTable.submitted_by,
          vote_id: votesTable.id,
        })
        .from(storiesTable)
        .where(sql`${storiesTable.id} = ${data.data.storyId}`)
        .leftJoin(
          votesTable,
          sql`${storiesTable.id} = ${votesTable.story_id} AND ${votesTable.user_id} = ${user.id}`
        )
        .limit(1)
    )[0];

    if (!story) {
      throw new Error("Story not found");
    }

    if (story.submitted_by === user.id) {
      return {
        error: {
          code: "SELF_UNVOTE_ERROR",
          message: "You can't unvote your own story",
        },
      };
    }

    await Promise.all([
      tx.delete(votesTable).where(sql`${votesTable.id} = ${story.vote_id}`),
      tx
        .update(storiesTable)
        .set({
          points: sql`${storiesTable.points} - 1`,
        })
        .where(sql`${storiesTable.id} = ${story.id}`),
      story.submitted_by
        ? tx
            .update(usersTable)
            .set({
              karma: sql`${usersTable.karma} - 1`,
            })
            .where(sql`${usersTable.id} = ${story.submitted_by}`)
        : Promise.resolve(),
    ]);

    // revalidate all data, including points for all stories
    revalidatePath("/", "layout");

    return {};
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

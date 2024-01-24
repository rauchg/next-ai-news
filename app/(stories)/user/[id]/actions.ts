"use server";

import { auth } from "@/app/auth";
import z from "zod";
import { redirect } from "next/navigation";
import { updateProfileRateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";
import { db, usersTable } from "@/app/db";
import { sql } from "drizzle-orm";

const UpdateProfileSchema = z.object({
  email: z.string().email().optional(),
  bio: z.string().optional(),
});

export type UpdateProfileActionData = {
  error?:
    | {
        code: "INTERNAL_ERROR" | "RATE_LIMIT_ERROR";
        message: string;
      }
    | {
        code: "VALIDATION_ERROR";
        fieldErrors: {
          [field: string]: string[];
        };
      };
};

export async function updateProfileAction(
  _prevState: unknown,
  formData: FormData
): Promise<UpdateProfileActionData | void> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const rl = await updateProfileRateLimit.limit(userId);

  if (!rl.success) {
    return {
      error: {
        code: "RATE_LIMIT_ERROR",
        message: "Too many updates. Try again later",
      },
    };
  }

  const email = formData.get("email");
  const bio = formData.get("bio");
  const input = UpdateProfileSchema.safeParse({
    // standardize empty strings to undefined
    email: email ? email : undefined,
    bio: bio ? bio : undefined,
  });

  if (!input.success) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        fieldErrors: input.error.flatten().fieldErrors,
      },
    };
  }

  try {
    await db
      .update(usersTable)
      .set({
        email: input.data.email,
        bio: input.data.bio,
      })
      .where(sql`${usersTable.id} = ${userId}`);
  } catch (err) {
    console.error(err);
    return {
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create. Please try again later",
      },
    };
  }

  revalidatePath(`/user/${userId.replace(/^user_/, "")}`);
}

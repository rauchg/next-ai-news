"use server";

import { signIn } from "@/app/auth";
import { AuthError } from "next-auth";
import z from "zod";
import { db, usersTable, genUserId } from "@/app/db";
import { sql } from "drizzle-orm";
import { hash } from "bcrypt";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { authRateLimit, signUpRateLimit } from "@/lib/rate-limit";

const UserSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .transform((v) => v.trim().toLowerCase()),
  password: z
    .string()
    .min(8)
    .max(256)
    .transform((v) => v.trim()),
  next: z.enum(["/", "/threads", "/submit"]).optional().default("/"),
});

export type SignInActionData = {
  error?: {
    code: "AUTH_ERROR" | "INTERNAL_ERROR";
    message: string;
  };
};

export async function signInAction(
  _prevState: any,
  formData: FormData
): Promise<SignInActionData | void> {
  const ip = headers().get("x-real-ip") ?? "local";
  const rl = await authRateLimit.limit(ip);

  if (!rl.success) {
    return {
      error: {
        code: "AUTH_ERROR",
        message: "Too many attempts. Try again later",
      },
    };
  }

  const input = UserSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    next:
      formData.get("next") ||
      undefined /* <input type=hidden value=''> should become the default next */,
  });

  if (!input.success) {
    return {
      error: {
        code: "AUTH_ERROR",
        message: "Auth failed. Check your credentials",
      },
    };
  }

  try {
    await signIn("credentials", {
      username: input.data.username,
      password: input.data.password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        error: {
          code: "AUTH_ERROR",
          message: "Auth failed. Check your credentials",
        },
      };
    } else {
      console.error("signIn error", err);
      return {
        error: {
          code: "INTERNAL_ERROR",
          message: "Server error. Please try again later",
        },
      };
    }
  }

  redirect(input.data.next);
}

export type SignUpActionData = {
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
          [key: string]: string[];
        };
      };
};

export async function signUpAction(
  _prevState: any,
  formData: FormData
): Promise<SignUpActionData | void> {
  const ip = headers().get("x-real-ip") ?? "local";
  const rl = await authRateLimit.limit(ip);

  if (!rl.success) {
    return {
      error: {
        code: "AUTH_ERROR",
        message: "Too many attempts. Try again later",
      },
    };
  }

  const input = UserSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    next:
      formData.get("next") ||
      undefined /* <input type=hidden value=''> should become the default next */,
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

  const user = await db
    .select()
    .from(usersTable)
    .where(sql`${usersTable.username} = ${input.data.username}`)
    .limit(1);

  if (user.length > 0) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        fieldErrors: {
          username: ["Username already exists"],
        },
      },
    };
  }

  const rl2 = await signUpRateLimit.limit(ip);

  if (!rl2.success) {
    return {
      error: {
        code: "AUTH_ERROR",
        message: "Too many signups. Try again later",
      },
    };
  }

  try {
    await db.insert(usersTable).values({
      id: genUserId(),
      username: input.data.username,
      password: await hash(input.data.password, 10),
    });
  } catch (err) {
    return {
      error: {
        code: "INTERNAL_ERROR",
        message: "Server error. Please try again later",
      },
    };
  }

  try {
    await signIn("credentials", {
      username: input.data.username,
      password: input.data.password,
      redirect: false,
    });
  } catch (err) {
    console.error("signIn error", err);
    return {
      error: {
        code: "INTERNAL_ERROR",
        message: "Server error. Please try again later",
      },
    };
  }

  redirect(input.data.next);
}

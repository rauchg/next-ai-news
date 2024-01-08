import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import { db, usersTable } from "@/app/db";
import { cookies } from "next/headers";
import { SubmitForm } from "./form";

/**
 * v0 by Vercel.
 * @see https://v0.dev/t/DzF8vF33OSe
 */

export default async function Submit() {
  const cookieJar = cookies();

  // fast path to being logged out, no i/o needed
  if (!cookieJar.getAll().length) {
    redirect("/login/next/submit");
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login/next/submit");
  }

  const user = (
    await db
      .select({
        id: usersTable.id,
      })
      .from(usersTable)
  )[0];

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="px-3">
      <SubmitForm />
    </div>
  );
}

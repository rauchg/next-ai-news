import { composeUserId, db, usersTable } from "@/app/db";
import { sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { auth } from "@/app/auth";
import { Created, Karma, Table, Username } from "./fields";
import { UpdateProfileForm } from "./form";

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

async function getUser(id: string, sessionUserId: string | undefined) {
  const userId = composeUserId(id);

  const user = (
    await db
      .select({
        ...{
          id: usersTable.id,
          username: usersTable.username,
          created_at: usersTable.created_at,
          karma: usersTable.karma,
          bio: usersTable.bio,
        },
        // protected fields that can be exposed only to the user
        // who owns the profile
        ...(userId && userId === sessionUserId
          ? {
              email: usersTable.email,
            }
          : {}),
      })
      .from(usersTable)
      .where(sql`${usersTable.id} = ${userId}`)
      .limit(1)
  )[0];

  if (!user) {
    return;
  }

  return {
    ...user,
    created_at_formatted: formatDate(user.created_at),
  };
}
export type User = NonNullable<Awaited<ReturnType<typeof getUser>>>;

function Profile({ user }: { user: User }) {
  return (
    <Table>
      <Username user={user} />
      <Created user={user} />
      <Karma user={user} />
      <tr>
        <td valign="top">about:</td>
        <td valign="top" className="h-24 w-full">
          <p className="h-full w-full max-w-[500px]">{user.bio}</p>
        </td>
      </tr>
    </Table>
  );
}

export default async function ProfilePage({
  params: { id: idParam },
}: {
  params: { id: string };
}) {
  const session = await auth();
  const userId = session?.user?.id;

  const user = await getUser(idParam, userId);
  if (!user) {
    notFound();
  }

  const isMe = userId && userId === user.id;

  // no need to create client-side components unless the user may update their profile
  return isMe ? <UpdateProfileForm user={user} /> : <Profile user={user} />;
}

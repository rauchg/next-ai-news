import Link from "next/link";
import type { User } from "./page";
import type { PropsWithChildren } from "react";

export function Username({ user }: { user: User }) {
  return (
    <tr>
      <td>user:</td>
      <td>
        <Link
          className="hover:underline"
          href={`/user/${user.id.replace(/^user_/, "")}`}
        >
          {user.username}
        </Link>
      </td>
    </tr>
  );
}

export function Created({ user }: { user: User }) {
  const now = Date.now();
  return (
    <tr>
      <td>created:</td>
      <td>{user.created_at_formatted}</td>
    </tr>
  );
}

export function Karma({ user }: { user: User }) {
  return (
    <tr>
      <td>karma:</td>
      <td>{user.karma}</td>
    </tr>
  );
}

export function Table({ children }: PropsWithChildren) {
  return (
    // negative margin counteracts border-spacing application to edges of table
    <table className="border-separate border-spacing-y-[8px] border-spacing-x-[8px] my-[-8px] mx-[-8px]">
      <tbody>{children}</tbody>
    </table>
  );
}

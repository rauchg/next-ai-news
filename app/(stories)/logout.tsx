"use client";
import { signOutAction } from "./actions";
import { useFormStatus } from "react-dom";

export function Logout() {
  return (
    <form action={signOutAction}>
      <LogoutButton />
    </form>
  );
}

function LogoutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className={`${
        pending ? "text-[#A87850]" : "cursor-pointer hover:underline"
      }`}
    >
      logout
    </button>
  );
}

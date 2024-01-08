"use server";
import { signOut } from "@/app/auth";

export async function signOutAction() {
  await signOut();
  return {};
}

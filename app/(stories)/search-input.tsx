"use client";
import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function SearchInput() {
  const pathname = usePathname();
  const router = useRouter();

  // capture the `/` keyboard shortcut
  useKey("/", () => {
    router.push("/search");
  });

  return (
    <Link
      href="/search"
      prefetch={true}
      className={`text-base text-zinc-500 w-1/2 inline-flex items-center border rounded-md border-zinc-200 bg-white px-2 h-8 ${
        pathname === "/search" ? "hidden" : ""
      }`}
    >
      Search…
    </Link>
  );
}

function useKey(key: String, fn: Function) {
  useEffect(() => {
    const handler = function (event: KeyboardEvent) {
      if (event.key === key) {
        fn();
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [key, fn]);
}

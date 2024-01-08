"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function MoreLink({ page, q }: { page: number; q: string | null }) {
  const pathname = usePathname();
  const params = new URLSearchParams({
    ...(q === null ? {} : { q }),
    ...(page > 1 ? { p: page.toString() } : {}),
  }).toString();
  return (
    <Link
      prefetch={true}
      href={`${pathname}${params.length ? `?${params}` : ""}`}
      className="text-md hover:underline text-[#666] md:text-gray-500"
    >
      More <span className="md:hidden">results</span>
    </Link>
  );
}

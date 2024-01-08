import { SearchInput } from "./input";
import { headers as dynamic } from "next/headers";
import z from "zod";
import { Stories } from "@/components/stories";
import { Suspense } from "react";

const SearchParamsSchema = z.object({
  q: z.string().max(256).optional().default(""),
});

export default function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  dynamic();

  const query = SearchParamsSchema.safeParse(searchParams);

  if (!query.success) {
    return <p>Bad request</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <SearchInput value={query.data.q} />
      </div>
      <div>
        <Suspense fallback={null}>
          <Stories q={query.data.q} />
        </Suspense>
      </div>
    </div>
  );
}

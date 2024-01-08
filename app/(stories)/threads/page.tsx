import { Comments } from "@/components/comments";
import { auth } from "@/app/auth";
import { redirect } from "next/navigation";

export default async function Threads({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const session = await auth();

  if (!searchParams.new && !session?.user?.id) {
    return redirect("/login/next/threads");
  }

  return (
    <div>
      <Comments
        author={searchParams.new ? undefined : (await auth())?.user?.id}
      />
    </div>
  );
}

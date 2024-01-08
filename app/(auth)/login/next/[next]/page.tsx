import { LoginPage } from "@/app/(auth)/login/page";
import { headers as dynamic } from "next/headers";

// we use this SSR route to form a dynamic
// render of the login / signup form that can ?next
// while retaining the happy path for `/login` static
// this will get more ergonomic once Next gains an API
// like `generateStaticSearchParams`

export default function Login({
  params: { next },
}: {
  params: { next: string };
}) {
  dynamic();
  return <LoginPage next={`/${next}`} />;
}

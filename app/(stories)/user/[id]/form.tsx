"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { updateProfileAction, type UpdateProfileActionData } from "./actions";
import type { User } from "./page";
import { Created, Karma, Table, Username } from "./fields";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

function ErrorMessage({ errors }: { errors: string[] }) {
  return (
    <div className="mt-1 text-md text-red-500">
      {errors.map((error) => (
        <div key={error}>{error}</div>
      ))}
    </div>
  );
}

function UpdateProfileFormFields({
  error,
  user,
}: UpdateProfileActionData & { user: User }) {
  const { pending } = useFormStatus();
  return (
    <>
      <Table>
        <Username user={user} />
        <Created user={user} />
        <Karma user={user} />
        <tr>
          <td valign="top">about:</td>
          <td valign="top" className="w-full">
            <Textarea
              className="w-full max-w-lg h-24"
              wrap="virtual"
              id="bio"
              name="bio"
              defaultValue={user.bio ?? undefined}
              disabled={pending}
            />
            {!pending &&
            error &&
            "fieldErrors" in error &&
            error.fieldErrors.bio != null ? (
              <ErrorMessage errors={error.fieldErrors.bio} />
            ) : null}
          </td>
        </tr>
        <tr>
          <td>email:</td>
          <td>
            <Input
              className="max-w-lg"
              autoCapitalize="off"
              id="email"
              type="text"
              name="email"
              defaultValue={user.email ?? undefined}
              disabled={pending}
              autoComplete="email"
            />
            {!pending &&
            error &&
            "fieldErrors" in error &&
            error.fieldErrors.email != null ? (
              <ErrorMessage errors={error.fieldErrors.email} />
            ) : null}
          </td>
        </tr>
      </Table>
      <div className="h-4" />
      <Button className="p-0 h-8 px-4" disabled={pending}>
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        update
      </Button>
      {error && "message" in error && !pending ? (
        <ErrorMessage errors={[error.message]} />
      ) : null}
    </>
  );
}

export function UpdateProfileForm({ user }: { user: User }) {
  const [state, formAction] = useFormState(updateProfileAction, {});

  return (
    <form action={formAction}>
      <UpdateProfileFormFields {...state} user={user} />
    </form>
  );
}

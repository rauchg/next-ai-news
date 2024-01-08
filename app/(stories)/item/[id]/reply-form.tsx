"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { replyAction, type ReplyActionData } from "./actions";
import { Loader2 } from "lucide-react";
import { useFormStatus, useFormState } from "react-dom";
import Link from "next/link";

export function ReplyForm({ storyId }: { storyId: string }) {
  const [state, formAction] = useFormState(replyAction, {});

  return (
    <form action={formAction}>
      <ReplyFormFields storyId={storyId} {...state} />
    </form>
  );
}

function ReplyFormFields({
  error,
  commentId,
  storyId,
}: ReplyActionData & {
  storyId: string;
}) {
  const { pending } = useFormStatus();

  return (
    <div key={commentId} className="flex flex-col gap-2">
      <input type="hidden" name="storyId" value={storyId} />

      <div className="flex flex-col gap-1">
        <Textarea
          name="text"
          className="w-full text-base bg-white"
          placeholder="Write a reply..."
          rows={4}
          onKeyDown={(e) => {
            if (
              (e.ctrlKey || e.metaKey) &&
              (e.key === "Enter" || e.key === "NumpadEnter")
            ) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        {!pending &&
        error &&
        "fieldErrors" in error &&
        error.fieldErrors.text != null ? (
          <div className="text-red-500 text-sm">{error.fieldErrors.text}</div>
        ) : null}
      </div>

      <div className="flex gap-2 items-center">
        <Button disabled={pending} className="p-0 h-8 px-4">
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Submit
        </Button>
        {error &&
          "message" in error &&
          (error.code === "AUTH_ERROR" ? (
            <span className="text-red-500 text-sm">
              You must be{" "}
              <Link className="text-red-800 hover:underline" href="/login">
                logged in
              </Link>{" "}
              to reply.
            </span>
          ) : (
            <span className="text-red-500 text-sm">{error.message}</span>
          ))}
      </div>
    </div>
  );
}

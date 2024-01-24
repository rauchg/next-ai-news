"use client";

import { unvoteAction, voteAction } from "@/app/(stories)/actions";
import { VoteIcon } from "@/components/icons/vote-icon";
import { useFormStatus } from "react-dom";

export function VoteForm({
  storyId,
  votedByMe,
}: {
  storyId: string;
  votedByMe: boolean;
}) {
  return (
    <form action={voteAction} className="w-3.5">
      <VoteFormFields storyId={storyId} votedByMe={votedByMe} />
    </form>
  );
}

function VoteFormFields({
  storyId,
  votedByMe,
}: {
  storyId: string;
  votedByMe: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <input type="hidden" name="storyId" value={storyId} />
      {!votedByMe && !pending && (
        <button>
          <VoteIcon />
        </button>
      )}
    </>
  );
}

export function UnvoteForm({ storyId }: { storyId: string }) {
  return (
    <form action={unvoteAction} className="inline">
      <UnvoteFormFields storyId={storyId} />
    </form>
  );
}

function UnvoteFormFields({ storyId }: { storyId: string }) {
  const { pending } = useFormStatus();

  return (
    <>
      <input type="hidden" name="storyId" value={storyId} />
      {!pending && (
        <>
          <span aria-hidden="true"> | </span>
          <button>unvote</button>
        </>
      )}
    </>
  );
}

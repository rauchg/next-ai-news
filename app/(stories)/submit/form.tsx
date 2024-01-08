"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Textarea } from "@/components/ui/textarea";
import { submitAction, type SubmitActionData } from "./actions";
import { useFormState } from "react-dom";

export function SubmitForm() {
  const [state, formAction] = useFormState(submitAction, {});

  return (
    <form action={formAction} className="max-w-2xl">
      <SubmitFormFields {...state} />
    </form>
  );
}

export function SubmitFormFields({ error }: SubmitActionData) {
  const { pending } = useFormStatus();

  return (
    <div className="space-y-4 py-1">
      <div className="flex flex-col flex-grow sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 items-start md:items-center">
        <label
          className="block text-sm font-medium text-gray-700 md:w-16 md:text-right"
          htmlFor="title"
        >
          Title
        </label>
        <Input
          id="title"
          className="text-base bg-white"
          name="title"
          autoFocus
          disabled={pending}
          placeholder="Enter title"
          type="text"
        />
      </div>
      {!pending &&
      error &&
      "fieldErrors" in error &&
      error.fieldErrors.title != null ? (
        <ErrorMessage errors={error.fieldErrors.title} />
      ) : null}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 items-start md:items-center">
        <label
          className="block text-sm font-medium text-gray-700 md:w-16 md:text-right"
          htmlFor="url"
        >
          URL
        </label>
        <Input
          id="url"
          name="url"
          disabled={pending}
          className="text-base bg-white"
          placeholder="Enter URL"
          type="url"
        />
      </div>
      {!pending &&
      error &&
      "fieldErrors" in error &&
      error.fieldErrors.url != null ? (
        <ErrorMessage errors={error.fieldErrors.url} />
      ) : null}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 items-start">
        <label
          className="block text-sm font-medium text-gray-700 md:pt-2 md:w-16 md:text-right"
          htmlFor="text"
        >
          Text
        </label>
        <Textarea
          id="text"
          name="text"
          className="text-base bg-white"
          disabled={pending}
          placeholder="Enter text"
          onKeyDown={(e) => {
            if (
              (e.ctrlKey || e.metaKey) &&
              (e.key === "Enter" || e.key === "NumpadEnter")
            ) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          rows={4}
        />
      </div>
      {!pending &&
      error &&
      "fieldErrors" in error &&
      error.fieldErrors.text != null ? (
        <ErrorMessage errors={error.fieldErrors.text} />
      ) : null}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 items-start">
        <div className="w-16" />
        <div className="mt-1 w-full">
          <Button className="p-0 h-8 px-4" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit
          </Button>

          {error && "message" in error ? (
            <p className="mt-4 text-md text-red-500">{error.message}</p>
          ) : null}

          <p className="mt-4 text-md text-gray-700">
            Leave url blank to submit a question for discussion. If there is no
            url, text will appear at the top of the thread. If there is a url,
            text is optional.
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorMessage({ errors }: { errors: string[] }) {
  return (
    <div className="flex flex-col sm:flex-row sm:space-y-0 sm:space-x-4 items-start">
      <div className="w-16" />
      <div className="mt-1 text-md text-red-500">
        {errors.map((error) => (
          <div key={error}>{error}</div>
        ))}
      </div>
    </div>
  );
}

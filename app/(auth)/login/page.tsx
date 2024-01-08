"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  signInAction,
  signUpAction,
  type SignInActionData,
  type SignUpActionData,
} from "./actions";
import { Loader2 } from "lucide-react";
import { useFormStatus, useFormState } from "react-dom";
import { useEffect, useRef } from "react";

export default function Login() {
  return <LoginPage />;
}

export function LoginPage({ next }: { next?: string }) {
  return (
    <main className="max-w-sm p-5">
      <h1 className="text-xl font-semibold mb-4 text-gray-800">Login</h1>
      <SignInForm next={next} />
      <div className="mt-3">
        <span className="cursor-default" title="Unimplemented">
          Forgot your password?
        </span>
      </div>
      <h2 className="text-xl font-semibold mt-8 mb-4 text-gray-800">
        Create Account
      </h2>
      <SignUpForm next={next} />
    </main>
  );
}

function SignInForm({ next }: { next?: string }) {
  const [state, formAction] = useFormState(signInAction, {});

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <SignInFormFields {...state} />
    </form>
  );
}

function SignInFormFields({ error }: SignInActionData) {
  const { pending } = useFormStatus();
  // focus on the input only if there is an error,
  // and there wasn't an error before
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (error && inputRef.current) {
      // only select if the input is not already focused
      if (document.activeElement !== inputRef.current) {
        inputRef.current?.select();
      }
    }
  }, [error]);
  return (
    <>
      <div>
        <label className="block text-gray-700 mb-1" htmlFor="username">
          Username:
        </label>
        <Input
          className="w-full text-base"
          autoFocus
          ref={inputRef}
          autoCapitalize="off"
          id="username"
          type="text"
          name="username"
          disabled={pending}
          autoComplete="username"
          required
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-1" htmlFor="password">
          Password:
        </label>
        <Input
          className="w-full text-base"
          id="password"
          type="password"
          name="password"
          disabled={pending}
          autoComplete="current-password"
          required
        />
      </div>
      <div className="flex gap-2 items-center">
        <Button className="p-0 h-8 px-4" disabled={pending}>
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Login
        </Button>
        {error && !pending ? (
          <span className="text-red-500 text-sm"> {error.message}</span>
        ) : null}
      </div>
    </>
  );
}

function SignUpForm({ next }: { next?: string }) {
  const [state, formAction] = useFormState(signUpAction, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="next" value={next} />
      <SignUpFormFields {...state} />
    </form>
  );
}

function SignUpFormFields({ error }: SignUpActionData) {
  const { pending } = useFormStatus();

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="block text-gray-700 mb-1" htmlFor="new-username">
          Username:
        </label>
        <Input
          className="w-full text-base"
          autoCapitalize="off"
          id="new-username"
          name="username"
          type="text"
          required
          disabled={pending}
          autoComplete="new-username"
        />

        {error && "fieldErrors" in error && error.fieldErrors.username ? (
          <div className="text-red-500 text-sm">
            {error.fieldErrors.username.map((err) => (
              <p key={err}>{err}</p>
            ))}
          </div>
        ) : null}
      </div>
      <div className="space-y-2">
        <label className="block text-gray-700 mb-1" htmlFor="new-password">
          Password:
        </label>
        <Input
          className="w-full text-base"
          id="new-password"
          name="password"
          type="password"
          disabled={pending}
          required
          autoComplete="new-password"
        />

        {error && "fieldErrors" in error && error.fieldErrors.password ? (
          <div className="text-red-500 text-sm">
            {error.fieldErrors.password.map((err) => (
              <p key={err}>{err}</p>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex gap-2 items-center">
        <Button className="p-0 h-8 px-4" disabled={pending}>
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create Account
        </Button>
        {error && "message" in error && !pending ? (
          <span className="text-red-500 text-sm"> {error.message}</span>
        ) : null}
      </div>
    </div>
  );
}

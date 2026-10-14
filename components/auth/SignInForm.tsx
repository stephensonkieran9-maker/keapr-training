"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type FormState } from "@/app/auth/actions";

export function SignInForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});
  const error = state.error ?? notice;
  return (
    <form action={action} className="auth-form" noValidate>
      {error && <p className="form-error" role="alert">{error}</p>}
      <input type="hidden" name="next" value={next ?? ""} />
      <label htmlFor="email">Work email</label>
      <input id="email" name="email" type="email" autoComplete="email" required />
      <div className="label-row">
        <label htmlFor="password">Password</label>
        <Link href="/forgot-password">Forgot password?</Link>
      </div>
      <input id="password" name="password" type="password" autoComplete="current-password" required />
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

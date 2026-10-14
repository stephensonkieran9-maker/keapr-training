"use client";

import { useActionState } from "react";
import { requestPasswordReset, type FormState } from "@/app/auth/actions";

export function ForgotForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, {});
  if (state.message) return <p className="form-ok" role="status">{state.message}</p>;
  return (
    <form action={action} className="auth-form" noValidate>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <label htmlFor="email">Work email</label>
      <input id="email" name="email" type="email" autoComplete="email" required />
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}

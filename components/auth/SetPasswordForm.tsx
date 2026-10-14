"use client";

import { useActionState } from "react";
import { setPassword, type FormState } from "@/app/auth/actions";

export function SetPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(setPassword, {});
  return (
    <form action={action} className="auth-form" noValidate>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <label htmlFor="password">New password</label>
      <input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required />
      <p className="hint">At least 10 characters.</p>
      <label htmlFor="confirm">Confirm password</label>
      <input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}

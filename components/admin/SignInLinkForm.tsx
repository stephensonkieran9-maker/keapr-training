"use client";

import { useActionState } from "react";
import { createSignInLink, type ActionState } from "@/lib/admin/actions";
import { CopyLink } from "./CopyLink";

export function SignInLinkForm({ userId, invited }: { userId: string; invited: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createSignInLink, {});
  return (
    <div className="form-stack">
      <form action={action}>
        <input type="hidden" name="userId" value={userId} />
        <button className="btn btn-ghost" type="submit" disabled={pending}>
          {pending ? "Creating…" : invited ? "Get a new invitation link" : "Get a password reset link"}
        </button>
      </form>
      {state.error && <div className="notice error" role="alert">{state.error}</div>}
      {state.ok && state.link && (
        <div className="notice ok" role="status">
          {state.message}
          <CopyLink link={state.link} />
        </div>
      )}
    </div>
  );
}

"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { setStaffPassword, type ActionState } from "@/lib/admin/actions";

/** Staff page: set a new password for someone so they can sign in now. */
export function SetPasswordForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(setStaffPassword, {});
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  if (!open && !state.ok) {
    return <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>Set a new password</button>;
  }
  return (
    <form ref={formRef} action={action} className="form-stack" noValidate>
      <input type="hidden" name="userId" value={userId} />
      {state.error && <div className="notice error" role="alert">{state.error}</div>}
      {state.ok && <div className="notice ok" role="status">{state.message}</div>}
      <div className="field">
        <label htmlFor="staffPassword">New password</label>
        <div className="option-row">
          <input id="staffPassword" name="password" type={show ? "text" : "password"} autoComplete="new-password" minLength={8} required />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShow((v) => !v)}>{show ? "Hide" : "Show"}</button>
        </div>
        <p className="hint">At least 8 characters. Their old password stops working.</p>
      </div>
      <div className="option-row">
        <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Saving…" : "Save password"}</button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}

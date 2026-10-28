"use client";

import { useActionState, useState } from "react";
import { deleteStaff, type ActionState } from "@/lib/admin/actions";

/** Staff page: delete someone completely, after typing their email. */
export function DeleteStaffForm({ userId, email, name }: { userId: string; email: string; name: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(deleteStaff, {});
  const [typed, setTyped] = useState("");
  const matches = typed.trim().toLowerCase() === email.toLowerCase();
  return (
    <form action={action} className="form-stack" noValidate>
      <input type="hidden" name="userId" value={userId} />
      <p style={{ margin: 0 }}>
        Deletes {name}&apos;s account and everything about their training: assignments, progress, quiz attempts and results.
        They disappear from Staff and reports, and can&apos;t sign in. <b>This can&apos;t be undone.</b> To keep their history, deactivate them instead.
      </p>
      {state.error && <div className="notice error" role="alert">{state.error}</div>}
      <div className="field">
        <label htmlFor="confirmEmail">Type <b>{email}</b> to confirm</label>
        <input id="confirmEmail" name="confirmEmail" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
      </div>
      <button className="btn btn-danger" type="submit" disabled={!matches || pending}>
        {pending ? "Deleting…" : `Delete ${name} permanently`}
      </button>
    </form>
  );
}

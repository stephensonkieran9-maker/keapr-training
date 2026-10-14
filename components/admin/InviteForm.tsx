"use client";

import { useActionState, useRef, useEffect } from "react";
import { inviteStaff, type ActionState } from "@/lib/admin/actions";
import { CopyLink } from "./CopyLink";

export function InviteForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(inviteStaff, {});
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="card">
      <h2>Add someone</h2>
      <p>Creates their account and gives you a one-time link to send them. They use it to choose a password.</p>
      <form ref={formRef} action={action} className="form-stack" noValidate>
        {state.error && <div className="notice error" role="alert">{state.error}</div>}
        <div className="field">
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" name="fullName" autoComplete="off" required />
        </div>
        <div className="field">
          <label htmlFor="inviteEmail">Work email</label>
          <input id="inviteEmail" name="email" type="email" autoComplete="off" required />
        </div>
        <div className="field">
          <label htmlFor="role">Role</label>
          <select id="role" name="role" defaultValue="learner">
            <option value="learner">Learner: takes assigned training</option>
            <option value="admin">Admin: manages staff, courses and reporting</option>
          </select>
        </div>
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add and get link"}
        </button>
      </form>
      {state.ok && state.link && (
        <div className="notice ok" role="status" style={{ marginTop: 14 }}>
          {state.message}
          <CopyLink link={state.link} />
        </div>
      )}
    </div>
  );
}

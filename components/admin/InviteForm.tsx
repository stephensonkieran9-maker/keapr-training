"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { inviteStaff, type ActionState } from "@/lib/admin/actions";
import { CopyLink } from "./CopyLink";

export function InviteForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(inviteStaff, {});
  const [method, setMethod] = useState<"link" | "password">("link");
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="card">
      <h2>Add someone</h2>
      <p>Creates their account. Either send them a one-time link to choose their own password, or set a password for them now.</p>
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
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label">How will they sign in?</legend>
          <label className="check">
            <input type="radio" name="method" value="link" checked={method === "link"} onChange={() => setMethod("link")} />
            Send them a link to choose their own password
          </label>
          <label className="check">
            <input type="radio" name="method" value="password" checked={method === "password"} onChange={() => setMethod("password")} />
            Set a password for them now
          </label>
        </fieldset>
        {method === "password" && (
          <div className="field">
            <label htmlFor="newPassword">Password</label>
            <div className="option-row">
              <input id="newPassword" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowPassword((v) => !v)}>{showPassword ? "Hide" : "Show"}</button>
            </div>
            <p className="hint">At least 8 characters. Give it to them separately; they can change it later with a reset link.</p>
          </div>
        )}
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Adding…" : method === "password" ? "Create account" : "Add and get link"}
        </button>
      </form>
      {state.ok && (
        <div className="notice ok" role="status" style={{ marginTop: 14 }}>
          {state.message}
          {state.link && <CopyLink link={state.link} />}
        </div>
      )}
    </div>
  );
}

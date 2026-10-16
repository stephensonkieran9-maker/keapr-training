"use client";

import { useActionState, useRef, useEffect } from "react";
import { reportProblem, type ReportState } from "@/lib/notification-actions";

export function ReportProblemForm({ courses }: { courses: string[] }) {
  const [state, action, pending] = useActionState<ReportState, FormData>(reportProblem, {});
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="form-stack">
      <div className="field">
        <label htmlFor="report-where">Where did it happen? (optional)</label>
        <select id="report-where" name="where" defaultValue="">
          <option value="">Not sure / somewhere else</option>
          {courses.map((c) => <option key={c} value={c}>{c}</option>)}
          <option value="Signing in">Signing in</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="report-message">What went wrong?</label>
        <textarea id="report-message" name="message" required minLength={5} maxLength={1000} rows={4} placeholder="For example: the video in lesson 2 stops halfway and won't restart." />
      </div>
      {state.error && <div className="notice error" role="alert">{state.error}</div>}
      {state.ok && <div className="notice ok" role="status">Sent. An admin will see it in their notifications.</div>}
      <div className="actions-row">
        <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Sending…" : "Send to admins"}</button>
      </div>
    </form>
  );
}

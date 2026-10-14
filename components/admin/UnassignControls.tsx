"use client";

import { useActionState, useState } from "react";
import { unassignCourse, type ActionState } from "@/lib/admin/actions";

type Mode = "keep" | "clear" | "reset";

const options: { mode: Mode; label: string; hint: string }[] = [
  { mode: "keep", label: "Unassign, keep progress", hint: "If you assign it again, they pick up where they left off." },
  { mode: "clear", label: "Unassign and clear progress", hint: "Their lesson passes and watch time are removed. If you assign it again, they start from scratch." },
  { mode: "reset", label: "Reset progress", hint: "They keep the course but start again from lesson 1, on the latest published version." },
];

export function UnassignControls({ enrolmentId, userId, courseTitle }: { enrolmentId: string; userId: string; courseTitle: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("keep");
  const [state, action, pending] = useActionState<ActionState, FormData>(unassignCourse, {});
  const destructive = mode !== "keep";

  if (!open) {
    return (
      <div className="actions-row">
        <button type="button" className="mini" onClick={() => setOpen(true)}>Unassign or reset…</button>
        {state.ok && <span className="hint" role="status">{state.message}</span>}
      </div>
    );
  }

  return (
    <form action={action} className="manage-assignment">
      <input type="hidden" name="enrolmentId" value={enrolmentId} />
      <input type="hidden" name="userId" value={userId} />
      <fieldset className="form-stack" style={{ border: 0, padding: 0, margin: 0, gap: 8 }}>
        <legend className="label" style={{ marginBottom: 6 }}>What should happen to {courseTitle}?</legend>
        {options.map((o) => (
          <label key={o.mode} className={`q-option${mode === o.mode ? " selected" : ""}`} style={{ alignItems: "flex-start" }}>
            <input type="radio" name="mode" value={o.mode} checked={mode === o.mode} onChange={() => setMode(o.mode)} />
            <span><b>{o.label}</b><br /><span className="hint">{o.hint}</span></span>
          </label>
        ))}
      </fieldset>
      <div className="field">
        <label htmlFor={`${enrolmentId}-reason`}>Reason (optional, saved in the history)</label>
        <input id={`${enrolmentId}-reason`} name="reason" maxLength={200} />
      </div>
      {destructive && (
        <label className="check">
          <input type="checkbox" name="confirm" value="yes" required />
          I understand their progress on this course will be cleared. Past quiz attempts stay in the history.
        </label>
      )}
      {state.error && <div className="notice error" role="alert">{state.error}</div>}
      <div className="actions-row">
        <button className={`btn btn-sm ${destructive ? "btn-danger" : "btn-ghost"}`} type="submit" disabled={pending}>
          {pending ? "Working…" : mode === "keep" ? "Unassign" : mode === "clear" ? "Unassign and clear" : "Reset progress"}
        </button>
        <button type="button" className="mini" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}

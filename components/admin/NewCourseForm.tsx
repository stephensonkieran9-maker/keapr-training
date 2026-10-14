"use client";

import { useActionState } from "react";
import { createCourse, type ActionState } from "@/lib/admin/actions";

export function NewCourseForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createCourse, {});
  return (
    <div className="card">
      <h2>New course</h2>
      <p>Start with a title. You'll add lessons and quiz questions next, and nothing is visible to staff until you publish and assign it.</p>
      <form action={action} className="form-stack" noValidate>
        {state.error && <div className="notice error" role="alert">{state.error}</div>}
        <div className="field">
          <label htmlFor="title">Course title</label>
          <input id="title" name="title" required />
        </div>
        <div className="field">
          <label htmlFor="description">Short description</label>
          <textarea id="description" name="description" rows={3} />
          <p className="hint">Shown on each learner's course card.</p>
        </div>
        <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Creating…" : "Create and add lessons"}</button>
      </form>
    </div>
  );
}

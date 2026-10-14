"use client";

import { useActionState } from "react";
import { assignCourse, type ActionState } from "@/lib/admin/actions";

export function AssignCourseForm({ userId, options }: { userId: string; options: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(assignCourse, {});
  if (options.length === 0) {
    return <p className="hint" style={{ margin: 0 }}>Every published course is already assigned, or none have been published yet.</p>;
  }
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="userId" value={userId} />
      <div className="field">
        <label htmlFor="courseId">Course</label>
        <select id="courseId" name="courseId" defaultValue="">
          <option value="" disabled>Choose a published course</option>
          {options.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
        </select>
      </div>
      {state.error && <div className="notice error" role="alert">{state.error}</div>}
      {state.ok && <div className="notice ok" role="status">{state.message}</div>}
      <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Assigning…" : "Assign course"}</button>
    </form>
  );
}

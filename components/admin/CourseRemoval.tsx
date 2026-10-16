"use client";

import { useActionState, useState } from "react";
import { archiveCourse, deleteCourse, restoreCourse, type ActionState } from "@/lib/admin/actions";

interface Props {
  courseId: string;
  title: string;
  archived: boolean;
  everAssigned: boolean;
  activeAssignments: number;
}

/** Archive (keeps all history) or, for a course never assigned, delete permanently. */
export function CourseRemoval({ courseId, title, archived, everAssigned, activeAssignments }: Props) {
  const [open, setOpen] = useState(false);
  const [archiveState, archiveAction, archiving] = useActionState<ActionState, FormData>(archiveCourse, {});
  const [restoreState, restoreAction, restoring] = useActionState<ActionState, FormData>(restoreCourse, {});
  const [deleteState, deleteAction, deleting] = useActionState<ActionState, FormData>(deleteCourse, {});

  if (archived) {
    return (
      <section className="card" aria-labelledby="removal-title">
        <h2 id="removal-title" style={{ marginTop: 0 }}>Archived</h2>
        <p className="hint">This course is hidden from the course list and can&apos;t be assigned. Everyone&apos;s progress and quiz history is kept.</p>
        <form action={restoreAction} className="actions-row">
          <input type="hidden" name="courseId" value={courseId} />
          <button className="btn btn-primary btn-sm" type="submit" disabled={restoring}>{restoring ? "Restoring…" : "Restore course"}</button>
          {restoreState.error && <span className="form-error" role="alert">{restoreState.error}</span>}
        </form>
      </section>
    );
  }

  return (
    <section className="card danger-zone" aria-labelledby="removal-title">
      <div className="ov-card-head">
        <h2 id="removal-title" style={{ margin: 0 }}>Remove this course</h2>
        {!open && <button type="button" className="mini" onClick={() => setOpen(true)}>Show options</button>}
      </div>
      {archiveState.ok && <div className="notice ok" role="status" style={{ marginTop: 10 }}>{archiveState.message}</div>}

      {open && (
        <div className="form-stack" style={{ marginTop: 12 }}>
          {!everAssigned ? (
            <form action={deleteAction} className="form-stack">
              <input type="hidden" name="courseId" value={courseId} />
              <p className="hint" style={{ margin: 0 }}>
                <b>Delete permanently.</b> This course has never been assigned to anyone, so no training records are affected. Its lessons, quiz
                questions and uploaded videos are deleted. This can&apos;t be undone.
              </p>
              <label className="check">
                <input type="checkbox" name="confirm" value="yes" required />
                Delete &ldquo;{title}&rdquo; for good
              </label>
              {deleteState.error && <div className="notice error" role="alert">{deleteState.error}</div>}
              <div className="actions-row">
                <button className="btn btn-danger btn-sm" type="submit" disabled={deleting}>{deleting ? "Deleting…" : "Delete course"}</button>
              </div>
            </form>
          ) : (
            <p className="hint" style={{ margin: 0 }}>
              This course has been assigned to people, so it can&apos;t be deleted: that would erase their training records. Archive it instead.
            </p>
          )}

          <form action={archiveAction} className="form-stack">
            <input type="hidden" name="courseId" value={courseId} />
            <p className="hint" style={{ margin: 0 }}>
              <b>Archive.</b> Hides it from the course list, assigning and search. Nothing is deleted and you can restore it later.
            </p>
            {activeAssignments > 0 && (
              <label className="check">
                <input type="checkbox" name="removeFromEveryone" value="yes" />
                Also remove it from the {activeAssignments} {activeAssignments === 1 ? "person" : "people"} who have it now (their progress stays in the history)
              </label>
            )}
            {archiveState.error && <div className="notice error" role="alert">{archiveState.error}</div>}
            <div className="actions-row">
              <button className="btn btn-ghost btn-sm" type="submit" disabled={archiving}>{archiving ? "Archiving…" : "Archive course"}</button>
              <button type="button" className="mini" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

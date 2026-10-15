"use client";

import { useActionState, useState } from "react";
import { markLessonComplete, type ActionState } from "@/lib/admin/actions";
import { formatShortDate } from "@/lib/format";
import type { LessonStep } from "@/lib/types";

type Lesson = LessonStep & { override?: { reason: string; at: string } };

export function LessonOverrides({ enrolmentId, userId, lessons }: { enrolmentId: string; userId: string; lessons: Lesson[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const r = await markLessonComplete(prev, fd);
    if (r.ok) setOpenId(null);
    return r;
  }, {});

  return (
    <details className="lesson-overrides">
      <summary>Lessons ({lessons.filter((l) => l.state === "passed").length} of {lessons.length} passed)</summary>
      {state.ok && <p className="hint" role="status" style={{ margin: "8px 0 0" }}>{state.message}</p>}
      <ol>
        {lessons.map((l) => (
          <li key={l.lessonId}>
            <div className="lo-row">
              <span className={`side-dot ${l.state}`} aria-hidden="true">{l.position}</span>
              <span className="lo-title">
                {l.title}
                <small>
                  {l.state === "passed"
                    ? l.override
                      ? `Marked complete by an admin ${formatShortDate(l.override.at)}: ${l.override.reason}`
                      : `Passed${l.bestScorePercent != null ? ` · best score ${l.bestScorePercent}%` : ""}`
                    : l.state === "locked"
                      ? "Locked"
                      : `Available${l.bestScorePercent != null ? ` · best score so far ${l.bestScorePercent}%` : ""}`}
                </small>
              </span>
              {l.state !== "passed" && openId !== l.lessonId && (
                <button type="button" className="mini" onClick={() => setOpenId(l.lessonId)}>Mark complete…</button>
              )}
            </div>
            {openId === l.lessonId && (
              <form action={action} className="manage-assignment">
                <input type="hidden" name="enrolmentId" value={enrolmentId} />
                <input type="hidden" name="lessonId" value={l.lessonId} />
                <input type="hidden" name="userId" value={userId} />
                <div className="field">
                  <label htmlFor={`${l.lessonId}-reason`}>Reason (required, saved with the completion)</label>
                  <input id={`${l.lessonId}-reason`} name="reason" maxLength={500} required placeholder="e.g. Covered in person on 14 Oct" />
                </div>
                <label className="check">
                  <input type="checkbox" name="confirm" value="yes" required />
                  Mark &ldquo;{l.title}&rdquo; complete without them passing the quiz. It shows as admin-marked in their record.
                </label>
                {state.error && <div className="notice error" role="alert">{state.error}</div>}
                <div className="actions-row">
                  <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>{pending ? "Saving…" : "Mark complete"}</button>
                  <button type="button" className="mini" onClick={() => setOpenId(null)}>Cancel</button>
                </div>
              </form>
            )}
          </li>
        ))}
      </ol>
    </details>
  );
}

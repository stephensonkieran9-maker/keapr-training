import Link from "next/link";
import type { EnrolmentDetail } from "@/lib/admin/attempt-detail-data";
import { formatDateTime, formatDuration, formatElapsed } from "@/lib/format";

const completedBy = { quiz_pass: "Passed the quiz", watched: "Watched the video", admin_override: "Marked complete by an admin" } as const;

/** Per-person course detail: lessons, attempts, scores, wrong answers and timings. */
export function EnrolmentDetailView({ d, staffId }: { d: EnrolmentDetail; staffId: string }) {
  const id = staffId;
  const passedLessons = d.lessons.filter((l) => l.completedAt).length;

  return (
    <>
      <div className="page-head">
        <div>
          <Link className="crumb" href={`/admin/staff/${id}`}>← {d.learnerName}</Link>
          <h1>{d.courseTitle}</h1>
          <p>
            {d.learnerName} · version {d.version} · assigned {formatDateTime(d.assignedAt)}
            {d.unassignedAt && ` · unassigned ${formatDateTime(d.unassignedAt)}`}
          </p>
        </div>
      </div>

      <section className="detail-stats" aria-label="Summary">
        <div className="card"><span className="label">Lessons complete</span><strong>{passedLessons} of {d.lessons.length}</strong></div>
        <div className="card"><span className="label">Started</span><strong>{d.startedAt ? formatDateTime(d.startedAt) : "Not yet"}</strong></div>
        <div className="card">
          <span className="label">{d.completedAt ? "Completed" : "Status"}</span>
          <strong>{d.completedAt ? formatDateTime(d.completedAt) : d.startedAt ? "In progress" : "Not started"}</strong>
          {d.elapsedSeconds != null && <small>{formatElapsed(d.elapsedSeconds)} from start to finish</small>}
        </div>
        <div className="card"><span className="label">Video watched</span><strong>{formatElapsed(d.totalWatchedSeconds)}</strong></div>
        <div className="card">
          <span className="label">Quiz attempts</span><strong>{d.totalAttempts}</strong>
          {d.quizLessons > 0 && <small>{d.passedFirstTime} of {d.quizLessons} quizzes passed first time</small>}
        </div>
      </section>

      {d.mostMissed.length > 0 && (
        <section className="card" aria-labelledby="missed-title">
          <h2 id="missed-title" style={{ marginTop: 0 }}>Questions they found hardest</h2>
          <ol className="missed-list">
            {d.mostMissed.slice(0, 8).map((m) => (
              <li key={`${m.lessonPosition}-${m.position}`}>
                <span className="missed-count">{m.misses}×</span>
                <span><b>Lesson {m.lessonPosition}, Q{m.position}.</b> {m.prompt}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {d.lessons.map((l) => (
        <section key={l.lessonId} className="card lesson-detail" aria-labelledby={`l-${l.lessonId}`}>
          <div className="ov-card-head">
            <h2 id={`l-${l.lessonId}`} style={{ margin: 0 }}>{l.position}. {l.title}</h2>
            <span className={`badge ${l.completedAt ? "st-completed" : l.startedAt ? "st-in_progress" : "st-not_started"}`}>
              {l.completedAt ? "Complete" : l.startedAt ? "In progress" : "Not started"}
            </span>
          </div>
          <dl className="kv lesson-kv">
            <dt>Video watched</dt><dd>{formatDuration(l.watchedSeconds)} of {formatDuration(l.videoSeconds)}</dd>
            <dt>Started</dt><dd>{l.startedAt ? formatDateTime(l.startedAt) : "—"}</dd>
            <dt>Completed</dt>
            <dd>
              {l.completedAt ? `${formatDateTime(l.completedAt)} · ${l.completedBy ? completedBy[l.completedBy] : ""}` : "—"}
              {l.overrideReason && <small className="muted"> ({l.overrideReason})</small>}
            </dd>
            <dt>Time to complete</dt><dd>{l.timeToCompleteSeconds != null ? formatElapsed(l.timeToCompleteSeconds) : "—"}</dd>
          </dl>

          {!l.hasQuiz ? (
            <p className="hint" style={{ margin: 0 }}>No quiz: this lesson completes when the video is watched.</p>
          ) : l.attempts.length === 0 ? (
            <p className="hint" style={{ margin: 0 }}>No quiz attempts yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="table attempts-table">
                <thead><tr><th>Attempt</th><th>Submitted</th><th>Score</th><th>Result</th><th>Time taken</th><th>Got wrong</th></tr></thead>
                <tbody>
                  {l.attempts.map((a) => (
                    <tr key={a.number}>
                      <td>#{a.number}</td>
                      <td>{formatDateTime(a.submittedAt)}</td>
                      <td>{a.correct}/{a.total} <small>{a.percent}% · pass mark {a.passMarkPercent}%</small></td>
                      <td><span className={`badge ${a.passed ? "st-completed" : "st-not_started"}`}>{a.passed ? "Passed" : "Not passed"}</span></td>
                      <td>{a.durationSeconds != null ? formatElapsed(a.durationSeconds) : <span className="muted">Not recorded</span>}</td>
                      <td>
                        {a.wrong.length === 0 ? (
                          <span className="muted">None</span>
                        ) : (
                          <details className="wrong-list">
                            <summary>{a.wrong.length} question{a.wrong.length === 1 ? "" : "s"}: Q{a.wrong.map((w) => w.position).join(", Q")}</summary>
                            <ul>
                              {a.wrong.map((w) => (
                                <li key={w.position}>
                                  <b>Q{w.position}.</b> {w.prompt}
                                  <small>Their answer: {w.chosen ?? "—"} · Correct: {w.correct ?? "—"}</small>
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}

      <p className="hint">Times are UK time. Quiz time taken starts from the first answer picked. Timings are only recorded from this update onwards, so older lessons and attempts show "—" or "Not recorded".</p>
    </>
  );
}

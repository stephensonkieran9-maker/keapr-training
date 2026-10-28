import type { ReviewedAttempt } from "@/lib/attempt-history";
import { formatDateTime } from "@/lib/format";

/** Past quiz attempts on a lesson: score, date, and each answer. */
export function AttemptHistory({ attempts, passMark, revealed }: { attempts: ReviewedAttempt[]; passMark: number; revealed: boolean }) {
  return (
    <section className="card attempt-history" id="attempts" aria-labelledby="attempts-title">
      <div className="ov-card-head">
        <h2 id="attempts-title" style={{ fontSize: 18 }}>Your quiz attempts</h2>
        <span className="hint">
          {revealed ? "Open an attempt to see your answers and the correct ones." : "Open an attempt to see your answers. Correct answers show once you've passed."}
        </span>
      </div>
      <ul className="attempt-list">
        {attempts.map((a) => {
          const pct = Math.floor((a.correct / Math.max(1, a.total)) * 100);
          return (
            <li key={a.id}>
              <details>
                <summary>
                  <span className={`badge ${a.passed ? "st-completed" : "st-not_started"}`}>{a.passed ? "Passed" : "Not passed"}</span>
                  <b>Attempt {a.number}</b>
                  <span className="attempt-score">{pct}% · {a.correct} of {a.total}</span>
                  <span className="muted">{formatDateTime(a.submittedAt)}</span>
                </summary>
                <p className="muted" style={{ margin: "8px 0 10px" }}>Pass mark {passMark}%.</p>
                <ol className="result-list">
                  {a.answers.map((r) => (
                    <li key={r.questionId} className={r.isCorrect ? "ok" : "no"}>
                      <span className="mark" aria-hidden="true">{r.isCorrect ? "✓" : "✕"}</span>
                      <div>
                        <div className="rq">{r.position}. {r.prompt}</div>
                        <div className="ra">
                          <span className="sr-only">{r.isCorrect ? "Correct. " : "Incorrect. "}</span>
                          Your answer: {r.chosen ?? "No answer"}
                          {!r.isCorrect && r.correct ? <> · Correct answer: {r.correct}</> : null}
                        </div>
                        {r.explanation && (revealed || r.isCorrect) && <div className="rx">{r.explanation}</div>}
                      </div>
                    </li>
                  ))}
                </ol>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

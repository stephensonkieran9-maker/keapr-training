import Link from "next/link";
import type { QuizResultSummary } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

/** Dashboard: every quiz they've taken, with a link back to their attempts. */
export function QuizResults({ results }: { results: QuizResultSummary[] }) {
  return (
    <section className="panel" aria-labelledby="quiz-results-title">
      <div className="panel-head">
        <h2 id="quiz-results-title">Your quiz results</h2>
      </div>
      <ul className="quiz-results">
        {results.map((r) => (
          <li key={r.lessonId}>
            <div className="qr-main">
              <div className="qr-title">{r.lessonTitle}</div>
              <div className="muted qr-sub">
                {r.courseTitle} · {r.attempts} attempt{r.attempts === 1 ? "" : "s"} · last {formatDateTime(r.lastAt)}
              </div>
            </div>
            <span className={`badge ${r.passed ? "st-completed" : "st-not_started"}`}>{r.passed ? "Passed" : "Not passed yet"}</span>
            <span className="qr-score">Best {r.bestPercent}%<small> · pass {r.passPercent}%</small></span>
            <Link className="btn btn-ghost btn-sm" href={`/lessons/${r.lessonId}#attempts`}>See attempts</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

"use client";

import { useState } from "react";
import { previewScore } from "@/lib/assessment/admin-actions";
import type { Answers } from "@/lib/assessment/fields";
import type { ScoreResult } from "@/lib/assessment/scoring";
import { TestScreen } from "../TestScreen";

/** The candidate screen for admins: same layout and hidden cut-off, but nothing is
 * saved, and submitting shows how the answers would be marked. */
export function PreviewTest({ id, photoUrls, ...props }: { id: string; title: string; caseStudy: string; fieldIds: string[]; deadlineAt: string; serverNow: number; photoUrls: Record<string, string> }) {
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState("");

  const submit = async (answers: Answers) => {
    const r = await previewScore(id, answers);
    if ("error" in r) { setError(r.error); return; }
    setResult(r);
  };

  return (
    <>
      <TestScreen
        {...props}
        initialAnswers={{}}
        save={null}
        photos={{ downloadHref: Object.keys(photoUrls).length ? `/admin/assessments/${id}/photos` : null, urls: photoUrls }}
        submit={submit}
        banner={<div className="at-preview">Preview: nothing you enter here is saved or shown in results.</div>}
      />
      {(result || error) && (
        <div className="at-overlay" role="dialog" aria-modal="true" aria-labelledby="pv-title">
          <div className="at-result">
            <h2 id="pv-title">{error ? "Couldn't mark the preview" : `Preview score: ${result!.accuracy.toFixed(1)}%`}</h2>
            {error && <p className="notice error">{error}</p>}
            {result && (
              <>
                <p>{result.points.toFixed(1)} of {result.maxPoints} points. This is how a candidate with these answers would be marked.</p>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Field</th><th>Your answer</th><th>Answer key</th><th>Mark</th></tr></thead>
                    <tbody>
                      {result.fields.map((f) => (
                        <tr key={f.id}>
                          <td>{f.label}</td>
                          <td className="ans">{f.given || <em>Blank</em>}{f.note && <small>{f.note}</small>}</td>
                          <td className="ans">{f.expected}</td>
                          <td>{Math.round(f.fraction * 100)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <div className="actions-row">
              <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>Start the preview again</button>
              <button className="btn btn-ghost" type="button" onClick={() => window.close()}>Close preview</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

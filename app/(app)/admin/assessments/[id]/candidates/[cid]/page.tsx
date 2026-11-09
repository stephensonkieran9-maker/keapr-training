import Link from "next/link";
import { notFound } from "next/navigation";
import { CandidatePasswordForm } from "@/components/assessment/admin/Editors";
import { requireAdmin } from "@/lib/auth";
import { getAssessment, getCandidateDetail } from "@/lib/assessment/admin";
import { deleteCandidate, resetAttempt } from "@/lib/assessment/admin-actions";
import { FIELD_BY_ID, PHOTO_CATEGORIES, SECTIONS, displayValue } from "@/lib/assessment/fields";
import { signPhotoUrls } from "@/lib/assessment/photos";
import { STATUS_LABEL, formatMinutesSeconds } from "@/lib/assessment/scoring";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Candidate · Keapr Training" };

function Mark({ fraction }: { fraction: number }) {
  if (fraction >= 0.999) return <span className="mk ok" aria-label="Correct">✓</span>;
  if (fraction <= 0.001) return <span className="mk bad" aria-label="Wrong">✗</span>;
  return <span className="mk part" aria-label="Partly correct">{Math.round(fraction * 100)}%</span>;
}

export default async function CandidatePage({ params }: { params: Promise<{ id: string; cid: string }> }) {
  await requireAdmin();
  const { id, cid } = await params;
  const a = await getAssessment(id);
  if (!a) notFound();
  const d = await getCandidateDetail(id, cid);
  if (!d) notFound();
  const { row, score } = d;
  const photoUrls = d.fieldIds.includes("photos") ? await signPhotoUrls(d.photos) : {};
  const photoByHash = new Map(d.photos.map((p) => [p.hash, p]));
  const theirPhotos = Array.isArray(d.answers.photos) ? (d.answers.photos as string[]) : [];
  const catLabel = (c: string) => PHOTO_CATEGORIES.find((x) => x.value === c)?.label.replace(/\s*\(.*\)$/, "") ?? c;
  const longText = ["title", "description", "neighbourhood", "additionalRules"].filter((f) => d.fieldIds.includes(f));

  return (
    <>
      <div className="page-head">
        <div>
          <Link className="crumb" href={`/admin/assessments/${id}`}>← {a.title}</Link>
          <h1>{row.name}</h1>
          <p>{row.email}{row.phone ? ` · ${row.phone}` : ""} · registered {formatDateTime(row.registeredAt)}</p>
        </div>
      </div>

      <div className="ov-tiles assess-tiles">
        <div className="card"><div className="eyebrow">Accuracy</div><div className="big">{row.accuracy === null ? "–" : `${row.accuracy.toFixed(1)}%`}</div>{score && <small>{score.points.toFixed(1)} of {score.maxPoints} points</small>}</div>
        <div className="card"><div className="eyebrow">Time taken</div><div className="big">{row.timeTakenSeconds === null ? "–" : formatMinutesSeconds(row.timeTakenSeconds)}</div><small>{a.timeLimitMinutes}-minute limit</small></div>
        <div className="card"><div className="eyebrow">Status</div><div className="big small-big">{STATUS_LABEL[row.status]}</div><small>{row.submittedAt ? formatDateTime(row.submittedAt) : row.startedAt ? `Started ${formatDateTime(row.startedAt)}` : "Not started"}</small></div>
      </div>

      {row.status === "in_progress" && (
        <p className="notice">
          Still working{d.deadlineAt ? `, time runs out at ${formatDateTime(d.deadlineAt)}` : ""}. {d.savedAt ? `Last autosave ${formatDateTime(d.savedAt)}.` : "Nothing saved yet."} Marks appear once they submit or time runs out.
        </p>
      )}

      {longText.length > 0 && row.startedAt && (
        <div className="card form-stack">
          <h2>What they wrote</h2>
          {longText.map((fid) => (
            <div key={fid}>
              <div className="eyebrow">{FIELD_BY_ID[fid].label}</div>
              <p className="wrote">{String(d.answers[fid] ?? "") || <em>Left blank</em>}</p>
            </div>
          ))}
        </div>
      )}

      {d.fieldIds.includes("photos") && row.startedAt && (
        <div className="card form-stack">
          <h2>Their photo order</h2>
          {theirPhotos.length === 0 ? <p><em>No photos uploaded.</em></p> : (
            <ol className="ph-grid ph-review">
              {theirPhotos.map((h, i) => {
                const p = photoByHash.get(h);
                return (
                  <li key={h} className={`ph-item${p ? "" : " unknown"}`}>
                    <span className="ph-n">{i + 1}</span>
                    {p && photoUrls[h] ? <img src={photoUrls[h]} alt={p.name} /> : <div className="ph-missing">Not a property photo</div>}
                    <small>{p ? catLabel(p.category) : "Unknown file"}</small>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}

      {score && SECTIONS.map((s) => {
        const fs = score.fields.filter((f) => f.section === s.id);
        if (!fs.length) return null;
        const pts = fs.reduce((n, f) => n + f.points, 0);
        const max = fs.reduce((n, f) => n + f.weight, 0);
        return (
          <div key={s.id} className="table-wrap">
            <table className="table mark-table">
              <caption>{s.label} <small>{pts.toFixed(1)} / {max} points</small></caption>
              <thead><tr><th>Field</th><th>Their answer</th><th>Answer key</th><th>Mark</th></tr></thead>
              <tbody>
                {fs.map((f) => (
                  <tr key={f.id}>
                    <td>{f.label}<small>Weight {f.weight}</small></td>
                    <td className="ans">{f.given || <em>Blank</em>}{f.note && <small>{f.note}</small>}</td>
                    <td className="ans">{f.expected}</td>
                    <td><Mark fraction={f.fraction} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {!score && row.status === "in_progress" && (
        <div className="table-wrap">
          <table className="table">
            <caption>Autosaved so far</caption>
            <tbody>
              {d.fieldIds.map((fid) => (
                <tr key={fid}><td>{FIELD_BY_ID[fid].label}</td><td className="ans">{displayValue(FIELD_BY_ID[fid], d.answers[fid]) || <em>Blank</em>}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="two-col">
        <div className="card">
          <h2>Forgotten password</h2>
          <CandidatePasswordForm id={id} candidateId={cid} />
        </div>
        <div className="card form-stack">
          <h2>Corrections</h2>
          {row.startedAt && (
            <form action={resetAttempt} className="form-stack">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="candidateId" value={cid} />
              <div className="field">
                <label htmlFor="reset-reason">Let them start again</label>
                <input id="reset-reason" name="reason" required maxLength={500} placeholder="Reason, e.g. internet dropped out after 5 minutes" />
                <p className="hint">Removes this attempt so they can start fresh with a full timer. The old answers and score are kept in the audit log.</p>
              </div>
              <div className="actions-row"><button className="btn btn-ghost btn-sm" type="submit">Reset attempt</button></div>
            </form>
          )}
          <form action={deleteCandidate} className="form-stack">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="candidateId" value={cid} />
            <p className="hint">Delete removes this candidate&apos;s details and answers completely, for example when they ask you to or you no longer need them.</p>
            <label className="check"><input type="checkbox" required /> <span>Yes, delete {row.name} and their answers</span></label>
            <div className="actions-row"><button className="btn btn-danger btn-sm" type="submit">Delete candidate</button></div>
          </form>
        </div>
      </div>
    </>
  );
}

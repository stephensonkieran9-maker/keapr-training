import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLink } from "@/components/admin/CopyLink";
import { AnswerKeyEditor, CaseStudyEditor, SettingsForm } from "@/components/assessment/admin/Editors";
import { PhotoManager } from "@/components/assessment/admin/PhotoManager";
import { signPhotoUrls } from "@/lib/assessment/photos";
import { Icon } from "@/components/Icons";
import { requireAdmin } from "@/lib/auth";
import { assessmentLink, getAssessment, loadCandidateRows } from "@/lib/assessment/admin";
import { duplicateAssessment, newLink, refreshFromSample, remarkAll, setArchived, setOpen } from "@/lib/assessment/admin-actions";
import { STATUS_LABEL, configProblems, formatMinutesSeconds, rankCandidates } from "@/lib/assessment/scoring";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Assessment · Keapr Training" };

const TABS = [
  { id: "results", label: "Results" },
  { id: "setup", label: "Setup" },
  { id: "case", label: "Case study" },
  { id: "photos", label: "Photos" },
  { id: "key", label: "Answer key" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const statusClass: Record<string, string> = { submitted: "done", timed_out: "done", in_progress: "prog", registered: "none" };

export default async function AssessmentPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; cantopen?: string; remarked?: string; deleted?: string; refreshed?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const a = await getAssessment(id);
  if (!a) notFound();
  const tab: Tab = (TABS.find((t) => t.id === sp.tab)?.id ?? "results") as Tab;
  const problems = configProblems(a.config);
  const link = assessmentLink(a.slug);
  const rows = tab === "results" ? rankCandidates(await loadCandidateRows(a.id)) : [];
  const finished = rows.filter((r) => r.accuracy !== null);
  const photoUrls = tab === "photos" ? await signPhotoUrls(a.config.photos ?? []) : {};
  let rank = 0;

  return (
    <>
      <div className="page-head">
        <div>
          <Link className="crumb" href="/admin/assessments">← Assessments</Link>
          <h1>{a.title}</h1>
          <p>
            {a.archivedAt ? <span className="badge deactivated">Archived</span> : a.isOpen ? <span className="badge active">Open for candidates</span> : <span className="badge draft">Closed</span>}
            {" "}{a.timeLimitMinutes}-minute time limit · {a.started} started
          </p>
        </div>
        <div className="actions-row">
          <a className="btn btn-ghost btn-sm" href={`/assessment-preview/${a.id}`} target="_blank" rel="noopener"><Icon name="eye" />Try it as a candidate</a>
          {!a.archivedAt && (
            <form action={setOpen}>
              <input type="hidden" name="id" value={a.id} />
              <input type="hidden" name="open" value={a.isOpen ? "0" : "1"} />
              <button className={`btn btn-sm ${a.isOpen ? "btn-ghost" : "btn-primary"}`} type="submit">{a.isOpen ? "Close to new candidates" : "Open for candidates"}</button>
            </form>
          )}
        </div>
      </div>

      {sp.cantopen && <p className="notice error" role="alert">It can&apos;t be opened or re-marked yet. Fix the answer key problems below{a.caseStudy.trim() ? "" : " and add a case study"} first.</p>}
      {sp.remarked && <p className="notice ok" role="status">Re-marked {sp.remarked} submitted attempt{sp.remarked === "1" ? "" : "s"} against the current answer key.</p>}
      {sp.deleted && <p className="notice ok" role="status">Candidate deleted.</p>}
      {sp.refreshed && <p className="notice ok" role="status">Updated to the latest sample case study and answer key. Your photos and settings were kept.</p>}

      <div className="card">
        <h2>Candidate link</h2>
        <p>Send this to candidates. They register, then press Start when they&apos;re ready. {a.isOpen ? "" : "It's closed at the moment, so nobody new can register or start."}</p>
        <CopyLink link={link} label="Candidate link" />
      </div>

      <nav className="tabs tabs-links" aria-label="Assessment sections">
        {TABS.map((t) => (
          <Link key={t.id} href={`/admin/assessments/${a.id}?tab=${t.id}`} aria-current={tab === t.id ? "page" : undefined}>
            {t.label}{t.id === "key" && problems.length > 0 ? " ⚠" : ""}
          </Link>
        ))}
      </nav>

      {tab === "results" && (
        <>
          <div className="page-head">
            <p>Ranked by accuracy, then by time taken. {finished.length} finished of {rows.length} registered.</p>
            <div className="actions-row">
              <a className="btn btn-primary btn-sm" href={`/admin/assessments/${a.id}/export`} download><Icon name="download" />Results CSV</a>
              {finished.length > 0 && (
                <form action={remarkAll}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="btn btn-ghost btn-sm" type="submit" title="Use after correcting a mistake in the answer key">Re-mark everyone</button>
                </form>
              )}
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Rank</th><th>Candidate</th><th>Status</th><th>Accuracy</th><th>Time taken</th><th>Submitted</th></tr>
              </thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={6} className="empty">Nobody has registered yet.</td></tr>}
                {rows.map((r) => (
                  <tr key={r.candidateId}>
                    <td>{r.accuracy !== null ? ++rank : "–"}</td>
                    <td>
                      <Link className="rowlink" href={`/admin/assessments/${a.id}/candidates/${r.candidateId}`}>{r.name}</Link>
                      <small>{r.email}</small>
                    </td>
                    <td><span className={`status ${statusClass[r.status]}`}>{STATUS_LABEL[r.status]}</span></td>
                    <td>{r.accuracy === null ? "–" : <strong>{r.accuracy.toFixed(1)}%</strong>}</td>
                    <td>{r.timeTakenSeconds === null ? "–" : formatMinutesSeconds(r.timeTakenSeconds)}</td>
                    <td>{r.submittedAt ? formatDateTime(r.submittedAt) : r.startedAt ? `Started ${formatDateTime(r.startedAt)}` : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "setup" && (
        <>
          <SettingsForm id={a.id} title={a.title} minutes={a.timeLimitMinutes} intro={a.intro} />
          <div className="card form-stack">
            <h2>Link and housekeeping</h2>
            <div className="actions-row">
              <form action={newLink}><input type="hidden" name="id" value={a.id} /><button className="btn btn-ghost btn-sm" type="submit">Make a new link</button></form>
              <span className="hint">The old link stops working. Registered candidates will need the new one.</span>
            </div>
            <div className="actions-row">
              <form action={refreshFromSample}><input type="hidden" name="id" value={a.id} /><button className="btn btn-ghost btn-sm" type="submit">Update to the latest sample</button></form>
              <span className="hint">Replaces the case study, instructions and answer key with the latest built-in sample. Keeps the photos, time limit and candidates.</span>
            </div>
            <div className="actions-row">
              <form action={duplicateAssessment}><input type="hidden" name="id" value={a.id} /><button className="btn btn-ghost btn-sm" type="submit">Duplicate</button></form>
              <span className="hint">Copies the case study, answer key and settings, without candidates. Handy for a new case study in the same format.</span>
            </div>
            <div className="actions-row">
              <form action={setArchived}>
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="archive" value={a.archivedAt ? "0" : "1"} />
                <button className="btn btn-ghost btn-sm" type="submit">{a.archivedAt ? "Unarchive" : "Archive"}</button>
              </form>
              <span className="hint">Archiving closes it and hides it from the list. Results are kept.</span>
            </div>
          </div>
        </>
      )}

      {tab === "case" && <CaseStudyEditor id={a.id} text={a.caseStudy} started={a.started} />}

      {tab === "photos" && (
        <PhotoManager id={a.id} started={a.started} photos={(a.config.photos ?? []).map((p) => ({ id: p.id, name: p.name, category: p.category, url: photoUrls[p.hash] ?? null }))} />
      )}

      {tab === "key" && (
        <>
          {problems.length > 0 && (
            <div className="notice error" role="alert">Fix these before opening the assessment:<ul>{problems.map((p) => <li key={p}>{p}</li>)}</ul></div>
          )}
          <AnswerKeyEditor id={a.id} config={a.config} started={a.started} />
        </>
      )}
    </>
  );
}

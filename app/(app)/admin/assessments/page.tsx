import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listAssessments } from "@/lib/assessment/admin";
import { createAssessment } from "@/lib/assessment/admin-actions";
import { formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Assessments · Keapr Training" };

export default async function AssessmentsPage({ searchParams }: { searchParams: Promise<{ archived?: string }> }) {
  await requireAdmin();
  const { archived } = await searchParams;
  const all = await listAssessments();
  const showArchived = archived === "1";
  const rows = all.filter((a) => Boolean(a.archivedAt) === showArchived);
  const archivedCount = all.filter((a) => a.archivedAt).length;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow"><b>Admin</b></div>
          <h1>Assessments</h1>
          <p>Timed listing-build tests for job candidates. Candidates register through each assessment&apos;s link and never see staff training.</p>
        </div>
        <div className="actions-row">
          <form action={createAssessment}><input type="hidden" name="from" value="sample" /><button className="btn btn-primary btn-sm" type="submit">New from sample case study</button></form>
          <form action={createAssessment}><input type="hidden" name="from" value="blank" /><button className="btn btn-ghost btn-sm" type="submit">New blank</button></form>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Assessment</th><th>Status</th><th>Time limit</th><th>Registered</th><th>Finished</th><th>Best accuracy</th><th>Created</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} className="empty">{showArchived ? "No archived assessments." : "No assessments yet. Start from the sample case study to see how it works."}</td></tr>
            )}
            {rows.map((a) => (
              <tr key={a.id}>
                <td><Link className="rowlink" href={`/admin/assessments/${a.id}`}>{a.title}</Link></td>
                <td>{a.archivedAt ? <span className="badge deactivated">Archived</span> : a.isOpen ? <span className="badge active">Open</span> : <span className="badge draft">Closed</span>}</td>
                <td>{a.timeLimitMinutes} min</td>
                <td>{a.registered}</td>
                <td>{a.finished}</td>
                <td>{a.bestAccuracy === null ? "–" : `${a.bestAccuracy.toFixed(1)}%`}</td>
                <td>{formatShortDate(a.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(archivedCount > 0 || showArchived) && (
        <p><Link className="crumb" href={showArchived ? "/admin/assessments" : "/admin/assessments?archived=1"}>{showArchived ? "← Back to current assessments" : `Show archived (${archivedCount})`}</Link></p>
      )}
    </>
  );
}

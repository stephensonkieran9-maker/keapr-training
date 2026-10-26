import Link from "next/link";
import { Icon } from "@/components/Icons";
import { requireAdmin } from "@/lib/auth";
import { timed } from "@/lib/timing";
import { loadReportInput } from "@/lib/admin/report-data";
import { buildReport, filterReport, filtersToQuery, parseFilters, statusLabel } from "@/lib/admin/report";
import { formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports · Keapr Training" };

const SHOW = 500;

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const filters = parseFilters(await searchParams);
  const input = await timed("report data", () => loadReportInput());
  const all = buildReport(input);
  const rows = filterReport(all, filters, input.paths);

  const courseOptions = [...new Map(all.map((r) => [r.courseId, r.courseTitle])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const counts = {
    completed: rows.filter((r) => r.status === "completed").length,
    inProgress: rows.filter((r) => r.status === "in_progress").length,
    notStarted: rows.filter((r) => r.status === "not_started").length,
  };
  const query = filtersToQuery(filters);
  const exportBase = `/admin/reports/export${query}`;
  const attemptsHref = `${exportBase}${query ? "&" : "?"}type=attempts`;
  const filtered = Boolean(filters.q || filters.course || filters.status || filters.inactive || filters.path);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow"><b>Admin</b></div>
          <h1>Reports</h1>
          <p>Every course assignment, with progress. Filter, then download as a spreadsheet.</p>
        </div>
        <div className="actions-row">
          <a className="btn btn-primary btn-sm" href={exportBase} download><Icon name="download" />Progress CSV</a>
          <a className="btn btn-ghost btn-sm" href={attemptsHref} download><Icon name="download" />Quiz attempts CSV</a>
        </div>
      </div>

      <form className="card report-filters" method="get" action="/admin/reports">
        <label className="field">
          <span>Person</span>
          <input type="search" name="q" defaultValue={filters.q} placeholder="Name or email" />
        </label>
        <label className="field">
          <span>Course</span>
          <select name="course" defaultValue={filters.course}>
            <option value="">All courses</option>
            {courseOptions.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
          </select>
        </label>
        {(input.paths?.length ?? 0) > 0 && (
          <label className="field">
            <span>Path</span>
            <select name="path" defaultValue={filters.path}>
              <option value="">All paths</option>
              {input.paths!.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
        )}
        <label className="field">
          <span>Status</span>
          <select name="status" defaultValue={filters.status}>
            <option value="">Any status</option>
            <option value="not_started">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <label className="check">
          <input type="checkbox" name="inactive" value="1" defaultChecked={filters.inactive} />
          <span>Include deactivated</span>
        </label>
        <div className="actions-row">
          <button className="btn btn-primary btn-sm" type="submit">Apply</button>
          {filtered && <Link className="btn btn-ghost btn-sm" href="/admin/reports">Clear</Link>}
        </div>
      </form>

      <p className="muted report-summary">
        {rows.length} assignment{rows.length === 1 ? "" : "s"} · {counts.completed} completed · {counts.inProgress} in progress · {counts.notStarted} not started
      </p>

      <div className="table-wrap">
        {rows.length === 0 ? (
          <p className="empty">{all.length === 0 ? "No courses assigned yet." : "Nothing matches these filters."}</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Person</th><th>Course</th><th>Status</th><th>Progress</th><th>Attempts</th><th>Last activity</th><th>Completed</th></tr>
            </thead>
            <tbody>
              {rows.slice(0, SHOW).map((r) => (
                <tr key={r.enrolmentId}>
                  <td>
                    <Link className="rowlink" href={`/admin/staff/${r.personId}`}>{r.name}</Link>
                    <small>{r.email}{!r.isActive && " · deactivated"}</small>
                  </td>
                  <td>
                    <Link className="rowlink" href={`/admin/staff/${r.personId}/courses/${r.enrolmentId}`}>{r.courseTitle}</Link>
                    <small>Version {r.version} · details</small>
                  </td>
                  <td><span className={`badge st-${r.status}`}>{statusLabel[r.status]}</span></td>
                  <td>
                    <div className="mini-progress" aria-hidden="true"><i style={{ width: `${r.percent}%` }} /></div>
                    <small>{r.lessonsPassed} of {r.lessonsRequired} lessons</small>
                  </td>
                  <td>{r.attempts}{r.failedAttempts > 0 && <small>{r.failedAttempts} not passed</small>}</td>
                  <td>{r.lastActivityAt ? formatShortDate(r.lastActivityAt) : "None yet"}</td>
                  <td>{r.completedAt ? formatShortDate(r.completedAt) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {rows.length > SHOW && <p className="muted" style={{ marginTop: 10 }}>Showing the first {SHOW}. The CSV includes all {rows.length}.</p>}
    </>
  );
}

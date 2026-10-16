import Link from "next/link";
import { NewCourseForm } from "@/components/admin/NewCourseForm";
import { requireAdmin } from "@/lib/auth";
import { timed } from "@/lib/timing";
import { listCourses } from "@/lib/admin/queries";
import { pathNamesByCourse } from "@/lib/admin/paths";
import { formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Courses · Keapr Training" };

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ archived?: string; deleted?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const showArchived = sp.archived === "1";
  const [all, pathNames] = await timed("course list", () => Promise.all([listCourses(), pathNamesByCourse()]));
  const archivedCount = all.filter((c) => c.archivedAt).length;
  const courses = all.filter((c) => (showArchived ? c.archivedAt : !c.archivedAt));

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow"><b>Admin</b></div>
          <h1>{showArchived ? "Archived courses" : "Courses"}</h1>
          <p>
            {showArchived
              ? "Hidden from the course list and can't be assigned. Open one to restore it."
              : "Build courses as drafts, then publish. Staff only see a course once it's published and assigned to them."}
          </p>
        </div>
        <div className="actions-row">
          {showArchived ? (
            <Link className="btn btn-ghost btn-sm" href="/admin/courses">← All courses</Link>
          ) : (
            archivedCount > 0 && <Link className="btn btn-ghost btn-sm" href="/admin/courses?archived=1">Archived ({archivedCount})</Link>
          )}
        </div>
      </div>

      {sp.deleted && <div className="notice ok" role="status">Course deleted.</div>}

      <div className="two-col">
        <div className="table-wrap">
          {courses.length === 0 ? (
            <p className="empty">{showArchived ? "No archived courses." : "No courses yet. Create your first one."}</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Course</th><th>Status</th><th>Paths</th><th>Lessons</th><th>Assigned</th><th>Updated</th></tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link className="rowlink" href={`/admin/courses/${c.id}`}>{c.title}</Link>
                      {c.isDemo && <small>Demo content</small>}
                    </td>
                    <td>
                      {c.archivedAt ? (
                        <span className="badge deactivated">Archived {formatShortDate(c.archivedAt)}</span>
                      ) : c.latestVersion ? (
                        <span className="badge active">Published v{c.latestVersion}</span>
                      ) : (
                        <span className="badge draft">Draft</span>
                      )}
                      {!c.archivedAt && c.latestVersion && c.hasUnpublishedChanges && <small>Unpublished changes</small>}
                    </td>
                    <td>{pathNames.get(c.id)?.length ? <small style={{ display: "block", color: "var(--fg)" }}>{pathNames.get(c.id)!.join(", ")}</small> : <span className="muted">None</span>}</td>
                    <td>{c.lessonCount}</td>
                    <td>{c.assignedCount}</td>
                    <td>{formatShortDate(c.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="form-stack">
          {!showArchived && (
            <section className="card">
              <h2 style={{ marginTop: 0 }}>Courses in order</h2>
              <p className="hint" style={{ margin: "0 0 12px" }}>
                Group courses into training paths (for example, one per team) to make them open in order, then assign the path to people.
              </p>
              <Link className="btn btn-ghost btn-sm" href="/admin/paths">Manage training paths</Link>
            </section>
          )}
          <NewCourseForm />
        </div>
      </div>
    </>
  );
}

import Link from "next/link";
import { NewCourseForm } from "@/components/admin/NewCourseForm";
import { TrainingPath } from "@/components/admin/TrainingPath";
import { requireAdmin } from "@/lib/auth";
import { timed } from "@/lib/timing";
import { listCourses } from "@/lib/admin/queries";
import { formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Courses · Keapr Training" };

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ archived?: string; deleted?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const showArchived = sp.archived === "1";
  const all = await timed("course list", () => listCourses());
  const archivedCount = all.filter((c) => c.archivedAt).length;
  const courses = all.filter((c) => (showArchived ? c.archivedAt : !c.archivedAt));
  const active = all.filter((c) => !c.archivedAt);
  const pathOrder = active.filter((c) => c.pathPosition != null).sort((a, b) => a.pathPosition! - b.pathPosition!).map((c) => c.id);

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
                <tr><th>Course</th><th>Status</th><th>Order</th><th>Lessons</th><th>Assigned</th><th>Updated</th></tr>
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
                    <td>{c.pathPosition ? `${c.pathPosition} in path` : <span className="muted">Open</span>}</td>
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
            <TrainingPath courses={active.map((c) => ({ id: c.id, title: c.title, published: Boolean(c.latestVersion) }))} initial={pathOrder} />
          )}
          <NewCourseForm />
        </div>
      </div>
    </>
  );
}

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { NewCourseForm } from "@/components/admin/NewCourseForm";
import { learnerFromProfile, requireAdmin } from "@/lib/auth";
import { listCourses } from "@/lib/admin/queries";
import { formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Courses · Keapr Training" };

export default async function CoursesPage() {
  const { profile } = await requireAdmin();
  const courses = await listCourses();

  return (
    <AppShell learner={learnerFromProfile(profile)} active="courses">
      <div className="page-head">
        <div>
          <div className="eyebrow"><b>Admin</b></div>
          <h1>Courses</h1>
          <p>Build courses as drafts, then publish. Staff only see a course once it's published and assigned to them.</p>
        </div>
      </div>

      <div className="two-col">
        <div className="table-wrap">
          {courses.length === 0 ? (
            <p className="empty">No courses yet. Create your first one.</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Course</th><th>Status</th><th>Lessons</th><th>Assigned</th><th>Updated</th></tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link className="rowlink" href={`/admin/courses/${c.id}`}>{c.title}</Link>
                      {c.isDemo && <small>Demo content</small>}
                    </td>
                    <td>
                      {c.latestVersion ? (
                        <span className="badge active">Published v{c.latestVersion}</span>
                      ) : (
                        <span className="badge draft">Draft</span>
                      )}
                      {c.latestVersion && c.hasUnpublishedChanges && <small>Unpublished changes</small>}
                    </td>
                    <td>{c.lessonCount}</td>
                    <td>{c.assignedCount}</td>
                    <td>{formatShortDate(c.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <NewCourseForm />
      </div>
    </AppShell>
  );
}

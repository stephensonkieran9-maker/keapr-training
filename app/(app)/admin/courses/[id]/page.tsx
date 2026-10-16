import Link from "next/link";
import { Icon } from "@/components/Icons";
import { CourseRemoval } from "@/components/admin/CourseRemoval";
import { notFound } from "next/navigation";
import { CourseEditor } from "@/components/admin/CourseEditor";
import { requireAdmin } from "@/lib/auth";
import { timed } from "@/lib/timing";
import { getCourseForEditor } from "@/lib/admin/queries";
import { formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit course · Keapr Training" };

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireAdmin();
  const { id } = await params;
  const course = await timed("course editor", () => getCourseForEditor(id));
  if (!course) notFound();

  return (
    <>
      <div className="page-head">
        <div>
          <Link className="crumb" href="/admin/courses">← Courses</Link>
          <h1>{course.title}</h1>
          <p>
            {course.latestVersion
              ? `Version ${course.latestVersion} published ${course.publishedAt ? formatShortDate(course.publishedAt) : ""}. Changes here stay in draft until you publish again.`
              : "Draft. Staff can't see this course until you publish it and assign it to them."}
          </p>
        </div>
        <div className="actions-row">
          {course.isDemo && <span className="demo">Demo content</span>}
          {course.archivedAt && <span className="badge deactivated">Archived</span>}
          <Link className="btn btn-ghost btn-sm" href={`/admin/courses/${course.id}/preview`} title="See the saved draft as staff will"><Icon name="eye" />Preview as learner</Link>
          {course.latestVersion ? <span className="badge active">Published v{course.latestVersion}</span> : <span className="badge draft">Draft</span>}
        </div>
      </div>
      <CourseEditor
        courseId={course.id}
        initialTitle={course.title}
        initialDescription={course.description}
        initialDraft={course.draft}
        latestVersion={course.latestVersion}
      />
      <CourseRemoval
        courseId={course.id}
        title={course.title}
        archived={Boolean(course.archivedAt)}
        everAssigned={course.everAssigned}
        activeAssignments={course.activeAssignments}
      />
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { PathCourses } from "@/components/admin/PathCourses";
import { AddPeopleToPath, DeletePathForm, PathDetailsForm, RemoveFromPath } from "@/components/admin/PathForms";
import { requireAdmin } from "@/lib/auth";
import { timed } from "@/lib/timing";
import { getPath } from "@/lib/admin/paths";
import { listCourses, listStaff } from "@/lib/admin/queries";
import { formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Training path · Keapr Training" };

export default async function PathPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [path, courses, staff] = await timed("path", () => Promise.all([getPath(id), listCourses(), listStaff()]));
  if (!path) notFound();

  const memberIds = new Set(path.members.map((m) => m.learnerId));
  const addable = staff.filter((s) => s.status !== "deactivated" && !memberIds.has(s.id)).map((s) => ({ id: s.id, name: s.fullName, email: s.email }));
  const courseOptions = courses.filter((c) => !c.archivedAt).map((c) => ({ id: c.id, title: c.title, published: Boolean(c.latestVersion) }));
  const total = path.courses.filter((c) => !c.archived).length;

  return (
    <>
      <div className="page-head">
        <div>
          <Link className="crumb" href="/admin/paths">← Training paths</Link>
          <h1>{path.name}</h1>
          <p>{path.courses.length} course{path.courses.length === 1 ? "" : "s"} · {path.members.length} {path.members.length === 1 ? "person" : "people"}</p>
        </div>
      </div>

      <div className="two-col">
        <section className="card" aria-labelledby="pc-title">
          <h2 id="pc-title" style={{ marginTop: 0 }}>Courses, in order</h2>
          <p className="hint" style={{ marginTop: 0 }}>
            Each course stays locked until the ones above it are finished. Draft courses are added for everyone once they&apos;re published.
          </p>
          <PathCourses pathId={path.id} courses={courseOptions} initial={path.courses.filter((c) => !c.archived).map((c) => c.courseId)} memberCount={path.members.length} />
        </section>

        <div className="form-stack">
          <section className="card">
            <h2 style={{ marginTop: 0 }}>Details</h2>
            <PathDetailsForm pathId={path.id} name={path.name} description={path.description} />
          </section>
          <section className="card">
            <h2 style={{ marginTop: 0 }}>Add people</h2>
            <p className="hint" style={{ marginTop: 0 }}>They&apos;ll get every published course in the path and a notification.</p>
            <AddPeopleToPath pathId={path.id} people={addable} />
          </section>
        </div>
      </div>

      <section className="table-wrap" aria-labelledby="members-title">
        <h2 id="members-title" style={{ padding: "14px 16px 0", margin: 0 }}>People on this path</h2>
        {path.members.length === 0 ? (
          <p className="empty">No one yet.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Name</th><th>Path progress</th><th>Added</th><th></th></tr></thead>
            <tbody>
              {path.members.map((m) => (
                <tr key={m.learnerId}>
                  <td>
                    <Link className="rowlink" href={`/admin/staff/${m.learnerId}`}>{m.name}</Link>
                    <small>{m.email}{!m.isActive && " · deactivated"}</small>
                  </td>
                  <td>
                    <div className="mini-progress" aria-hidden="true"><i style={{ width: `${total ? Math.round((m.completedCourses / total) * 100) : 0}%` }} /></div>
                    <small>{m.completedCourses} of {total} courses complete</small>
                  </td>
                  <td>{formatShortDate(m.assignedAt)}</td>
                  <td><RemoveFromPath pathId={path.id} userId={m.learnerId} label="path" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <DeletePathForm pathId={path.id} name={path.name} members={path.members.length} />
    </>
  );
}

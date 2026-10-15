import Link from "next/link";
import { notFound } from "next/navigation";
import { AssignCourseForm } from "@/components/admin/AssignCourseForm";
import { SignInLinkForm } from "@/components/admin/SignInLinkForm";
import { ProgressBar } from "@/components/ProgressBar";
import { requireAdmin } from "@/lib/auth";
import { timed } from "@/lib/timing";
import { getStaffMember, publishedCourseOptions } from "@/lib/admin/queries";
import { setActive, setRole } from "@/lib/admin/actions";
import { UnassignControls } from "@/components/admin/UnassignControls";
import { LessonOverrides } from "@/components/admin/LessonOverrides";
import { formatShortDate, percent } from "@/lib/format";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  "self-demote": "You can't remove your own admin access. Ask another admin to do it.",
  "self-deactivate": "You can't deactivate your own account. Ask another admin to do it.",
};

export default async function StaffMemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { profile } = await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;
  const [person, courseOptions] = await timed("staff member", () => Promise.all([getStaffMember(id), publishedCourseOptions()]));
  if (!person) notFound();

  const assignedIds = new Set(person.courses.map((c) => c.courseId));
  const available = courseOptions.filter((o) => !assignedIds.has(o.id));
  const isMe = person.id === profile.id;

  return (
    <>
      <div className="page-head">
        <div>
          <Link className="crumb" href="/admin/staff">← Staff</Link>
          <h1>{person.fullName}{isMe ? " (you)" : ""}</h1>
          <p>{person.email}</p>
        </div>
        <div className="actions-row">
          <span className={`badge ${person.role}`}>{person.role === "admin" ? "Admin" : "Learner"}</span>
          <span className={`badge ${person.status}`}>
            {person.status === "active" ? "Active" : person.status === "invited" ? "Invited" : "Deactivated"}
          </span>
        </div>
      </div>

      {error && errors[error] && <div className="notice error" role="alert">{errors[error]}</div>}

      <div className="two-col">
        <section className="card" aria-labelledby="assigned-title">
          <h2 id="assigned-title">Assigned training</h2>
          {person.courses.length === 0 ? (
            <p>No courses assigned yet.</p>
          ) : (
            <div className="form-stack">
              {person.courses.map((c) => {
                const pct = percent(c.lessonsPassed, c.lessonCount);
                return (
                  <div key={c.enrolmentId} className="question">
                    <div className="question-head" style={{ color: "var(--fg)" }}>
                      <span style={{ fontSize: 15 }}>{c.title}</span>
                      <span className={`status ${c.status === "completed" ? "done" : c.status === "in_progress" ? "prog" : "none"}`}>
                        {c.status === "completed" ? `Completed${c.completedOn ? ` ${formatShortDate(c.completedOn)}` : ""}` : c.status === "in_progress" ? "In progress" : "Not started"}
                      </span>
                    </div>
                    <ProgressBar label="Lessons passed" value={pct} valueLabel={`${c.lessonsPassed} of ${c.lessonCount}`} />
                    <LessonOverrides enrolmentId={c.enrolmentId} userId={person.id} lessons={c.lessons} />
                    <UnassignControls enrolmentId={c.enrolmentId} userId={person.id} courseTitle={c.title} />
                  </div>
                );
              })}
            </div>
          )}
          <h2 style={{ marginTop: 20 }}>Assign a course</h2>
          <AssignCourseForm userId={person.id} options={available} />
        </section>

        <div className="form-stack">
          <section className="card">
            <h2>Sign-in</h2>
            <dl className="kv">
              <dt>Last sign-in</dt><dd>{person.lastSignInAt ? formatShortDate(person.lastSignInAt) : "Never"}</dd>
              <dt>Added</dt><dd>{formatShortDate(person.createdAt)}</dd>
            </dl>
            <div style={{ marginTop: 14 }}>
              {person.isActive ? (
                <SignInLinkForm userId={person.id} invited={person.status === "invited"} />
              ) : (
                <p className="hint" style={{ margin: 0 }}>Reactivate the account to send a sign-in link.</p>
              )}
            </div>
          </section>

          <section className="card">
            <h2>Access</h2>
            <div className="form-stack">
              <form action={setRole}>
                <input type="hidden" name="userId" value={person.id} />
                <input type="hidden" name="role" value={person.role === "admin" ? "learner" : "admin"} />
                <button className="btn btn-ghost" type="submit" disabled={isMe && person.role === "admin"}>
                  {person.role === "admin" ? "Change to learner" : "Make admin"}
                </button>
              </form>
              <form action={setActive}>
                <input type="hidden" name="userId" value={person.id} />
                <input type="hidden" name="active" value={person.isActive ? "false" : "true"} />
                <button className={`btn ${person.isActive ? "btn-danger" : "btn-primary"}`} type="submit" disabled={isMe}>
                  {person.isActive ? "Deactivate account" : "Reactivate account"}
                </button>
              </form>
              <p className="hint" style={{ margin: 0 }}>
                Deactivating blocks sign-in straight away. Their training history is kept and returns if you reactivate them.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

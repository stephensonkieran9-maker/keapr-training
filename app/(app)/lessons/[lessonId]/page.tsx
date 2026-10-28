import Link from "next/link";
import { LinkedText } from "@/components/LinkedText";
import { LessonLinks } from "@/components/LessonLinks";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icons";
import { LessonClient } from "@/components/lesson/LessonClient";
import { getLessonView } from "@/lib/lesson";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ComingSoon } from "@/components/ComingSoon";
import { CourseChecklist } from "@/components/CourseChecklist";
import { groupChecklist, loadChecklist } from "@/lib/checklist";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  if (!isSupabaseConfigured()) {
    return <ComingSoon title="Lesson player" body="Lessons need a signed-in account. Open the live app to try one." />;
  }
  const { lessonId } = await params;
  const view = await getLessonView(lessonId);
  if (!view) notFound();
  const { lesson } = view;
  // This lesson's checklist items (tracking only, never locks anything).
  const checklist = (await loadChecklist(await createClient(), view.courseVersionId, view.enrolmentId)).filter((i) => i.lessonId === lesson.id);
  lesson.hasChecklist = checklist.length > 0;

  return (
    <div className="lesson-page" id="lesson-top">
      <div className="page-head">
        <div>
          <Link className="crumb" href={`/courses/${view.courseId}`}>← {view.courseTitle}</Link>
          <div className="eyebrow" style={{ marginTop: 6 }}>
            Lesson {lesson.position} of {view.lessonCount}
            {view.state === "passed" && <> · <b>Passed</b></>}
            {view.isDemo && <> <span className="demo">Demo content</span></>}
          </div>
          <h1>{lesson.title}</h1>
        </div>
      </div>

      <div className="lesson-layout">
        <div className="lesson-col">
          {view.state !== "locked" && <LessonLinks notes={lesson.notes} downloads={view.resources} />}
          {view.state === "locked" ? (
            <section className="card quiz quiz-locked">
              <span className="lock-badge" aria-hidden="true"><Icon name="lock" /></span>
              <div>
                <h2>This lesson is locked</h2>
                <p className="muted">{view.lockedReason ?? "Pass the previous lesson's quiz to unlock it."}</p>
                <Link className="btn btn-primary btn-sm" href={`/courses/${view.courseId}`} style={{ marginTop: 10 }}>Back to course</Link>
              </div>
            </section>
          ) : (
            <LessonClient view={view} />
          )}

          {view.state !== "locked" && checklist.length > 0 && (
            <section className="card" aria-labelledby="lesson-checklist-title">
              <div className="ov-card-head">
                <h2 id="lesson-checklist-title" style={{ fontSize: 18 }}>Checklist</h2>
                <span className="hint">Tick things off as you do them. This doesn&apos;t lock or unlock anything.</span>
              </div>
              <CourseChecklist
                sections={groupChecklist(checklist).map((sec) => ({ title: sec.title, items: sec.items.map((i) => ({ id: i.id, label: i.label, ticked: Boolean(i.tickedAt) })) }))}
              />
            </section>
          )}

          {(lesson.objectives.length > 0 || lesson.notes || view.resources.length > 0) && (
            <section className="card lesson-info" id="notes">
              {lesson.objectives.length > 0 && (
                <>
                  <h2>What you'll learn</h2>
                  <ul className="objectives">{lesson.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
                </>
              )}
              {lesson.notes && (
                <>
                  <h2>Notes</h2>
                  <p className="notes"><LinkedText text={lesson.notes} /></p>
                </>
              )}
              {view.resources.length > 0 && (
                <>
                  <h2>Downloads</h2>
                  <ul className="objectives">
                    {view.resources.map((r) => (
                      <li key={r.id}>
                        {r.href ? <a className="notes-link" href={r.href} download>{r.title}</a> : r.title}
                        {r.sizeLabel && <span className="muted"> · {r.sizeLabel}</span>}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}
        </div>

        <aside className="lesson-side card" aria-label="Lessons in this course">
          <h2>{view.courseTitle}</h2>
          <ol className="side-steps">
            {view.steps.map((s) => {
              const current = s.lessonId === lesson.id;
              const inner = (
                <>
                  <span className={`side-dot ${s.state}`} aria-hidden="true">
                    {s.state === "passed" ? <Icon name="check" /> : s.state === "locked" ? <Icon name="lock" /> : s.position}
                  </span>
                  <span className="side-title">{s.title}</span>
                  <span className="sr-only">{s.state === "passed" ? " (passed)" : s.state === "locked" ? " (locked)" : " (available)"}</span>
                </>
              );
              return (
                <li key={s.lessonId} className={current ? "current" : ""}>
                  {s.state === "locked" ? (
                    <span className="side-link locked" title={s.lockedReason}>{inner}</span>
                  ) : (
                    <Link className="side-link" href={`/lessons/${s.lessonId}`} aria-current={current ? "page" : undefined}>{inner}</Link>
                  )}
                </li>
              );
            })}
          </ol>
        </aside>
      </div>
    </div>
  );
}

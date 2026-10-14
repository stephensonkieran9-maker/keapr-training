import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icons";
import { LessonClient } from "@/components/lesson/LessonClient";
import { getLessonView } from "@/lib/lesson";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ComingSoon } from "@/components/ComingSoon";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  if (!isSupabaseConfigured()) {
    return <ComingSoon title="Lesson player" body="Lessons need a signed-in account. Open the live app to try one." />;
  }
  const { lessonId } = await params;
  const view = await getLessonView(lessonId);
  if (!view) notFound();
  const { lesson } = view;

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
                  <p className="notes">{lesson.notes}</p>
                </>
              )}
              {view.resources.length > 0 && (
                <>
                  <h2>Downloads</h2>
                  <ul className="objectives">{view.resources.map((r) => <li key={r.id}>{r.title}</li>)}</ul>
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

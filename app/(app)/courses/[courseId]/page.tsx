import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icons";
import { ProgressBar } from "@/components/ProgressBar";
import { ComingSoon } from "@/components/ComingSoon";
import { requireProfile } from "@/lib/auth";
import { loadLearnerProgress } from "@/lib/learner-progress";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatShortDate, percent } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  if (!isSupabaseConfigured()) {
    return <ComingSoon title="Course overview" body="Courses need a signed-in account. Open the live app to see yours." />;
  }
  const { courseId } = await params;
  const { profile, supabase } = await requireProfile();
  const { enrolments, computed } = await loadLearnerProgress(supabase, profile.id);
  const enrolment = enrolments.find((e) => e.courseId === courseId);
  if (!enrolment) notFound();

  const summary = computed.courses.find((c) => c.enrolmentId === enrolment.enrolmentId)!;
  const steps = computed.stepsByEnrolment.get(enrolment.enrolmentId) ?? [];
  const next = steps.find((s) => s.state === "available");
  const minutes = summary.durationMinutes;
  const pct = percent(summary.lessonsPassed, summary.lessonCount);
  const completedOn = enrolment.completedAt;

  return (
    <div className="ov">
      <div className="page-head">
        <div>
          <Link className="crumb" href="/dashboard">← Dashboard</Link>
          <div className="eyebrow" style={{ marginTop: 6 }}>
            Course{enrolment.version ? ` · version ${enrolment.version}` : ""}
            {enrolment.isDemo && <> <span className="demo">Demo content</span></>}
          </div>
          <h1>{enrolment.title}</h1>
          {enrolment.description && <p>{enrolment.description}</p>}
        </div>
        {next && summary.status !== "completed" && (
          <Link className="btn btn-primary" href={`/lessons/${next.lessonId}`}>
            {summary.status === "not_started" ? "Start course" : "Continue"}<Icon name="arrow" />
          </Link>
        )}
      </div>

      {summary.status === "completed" && (
        <section className="card completion" aria-label="Completion record">
          <span className="lock-badge done" aria-hidden="true"><Icon name="award" /></span>
          <div>
            <h2>Course completed</h2>
            <p className="muted">
              {enrolment.title}
              {enrolment.version ? `, version ${enrolment.version}` : ""}
              {completedOn ? `, completed ${formatShortDate(completedOn)} ${new Date(completedOn).getFullYear()}` : ""}.
              Lessons stay available if you want to review them.
            </p>
          </div>
        </section>
      )}

      <section className="card">
        <div className="ov-card-head">
          <h2>Your progress</h2>
          <span className="hint">{summary.lessonCount} lessons · about {minutes} min</span>
        </div>
        <ProgressBar label="Lessons passed" value={pct} valueLabel={`${summary.lessonsPassed} of ${summary.lessonCount}`} />
      </section>

      <section className="panel" aria-labelledby="lessons-title">
        <div className="panel-head">
          <h2 id="lessons-title">Lessons</h2>
          <div className="req">Lessons unlock in order. Pass each quiz to open the next one.</div>
        </div>
        <ol className="steps">
          {steps.map((s) => {
            const lesson = enrolment.lessons.find((l) => l.id === s.lessonId);
            const mins = lesson?.estimatedMinutes ?? (lesson ? Math.ceil(lesson.videoSeconds / 60) : null);
            if (s.state === "locked") {
              return (
                <li key={s.lessonId} className="step locked">
                  <span className="st" aria-hidden="true"><Icon name="lock" /></span>
                  <div><div className="n">Lesson {s.position} · Locked</div><div className="t">{s.title}</div></div>
                  <div className="right"><span className="why"><Icon name="info" />{s.lockedReason}</span></div>
                </li>
              );
            }
            if (s.state === "passed") {
              return (
                <li key={s.lessonId} className="step done">
                  <span className="st" aria-hidden="true"><Icon name="check" /></span>
                  <div><div className="n">Lesson {s.position} <span className="pill">Passed</span></div><div className="t">{s.title}</div></div>
                  <div className="right">
                    {s.bestScorePercent !== undefined && <span className="score">Best score {s.bestScorePercent}%</span>}
                    <Link className="link" href={`/lessons/${s.lessonId}`}>Review</Link>
                  </div>
                </li>
              );
            }
            return (
              <li key={s.lessonId} className="step current">
                <span className="st" aria-hidden="true"><Icon name="play" /></span>
                <div><div className="n">Lesson {s.position} <span className="pill cur">Available</span></div><div className="t">{s.title}</div></div>
                <div className="right">
                  {mins && <span className="muted">About {mins} min</span>}
                  <Link className="btn btn-primary btn-sm" href={`/lessons/${s.lessonId}`}>{s.bestScorePercent !== undefined ? "Retry" : "Start"}</Link>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

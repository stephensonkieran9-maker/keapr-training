import Link from "next/link";
import { LinkedText } from "@/components/LinkedText";
import { LessonLinks } from "@/components/LessonLinks";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icons";
import { LessonClient } from "@/components/lesson/LessonClient";
import { requireAdmin } from "@/lib/auth";
import { getCourseForEditor } from "@/lib/admin/queries";
import { cleanDraft } from "@/lib/admin/draft";
import { previewQuestions } from "@/lib/admin/preview";
import { resolveVideo, type LessonView } from "@/lib/lesson";
import { signDownloads } from "@/lib/downloads";
import { CourseChecklist, type ChecklistSectionView } from "@/components/CourseChecklist";

function groupDraft(items: { key: string; section: string; label: string }[]): ChecklistSectionView[] {
  const out: ChecklistSectionView[] = [];
  for (const i of items) {
    const last = out[out.length - 1];
    const item = { id: i.key, label: i.label, ticked: false };
    if (last && last.title === i.section) last.items.push(item);
    else out.push({ title: i.section, items: [item] });
  }
  return out;
}

export const dynamic = "force-dynamic";
export const metadata = { title: "Preview · Keapr Training" };

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const course = await getCourseForEditor(id);
  if (!course) notFound();

  const draft = cleanDraft(course.draft);
  const total = draft.lessons.length;
  const banner = (
    <div className="preview-banner" role="status">
      <Icon name="eye" />
      <span>
        <b>Preview.</b> You're seeing this course as staff will. Nothing you do here is saved. It shows your last saved draft
        {course.latestVersion ? `, which may differ from published version ${course.latestVersion}` : ""}.
      </span>
      <Link className="btn btn-ghost btn-sm" href={`/admin/courses/${id}`}>Exit preview</Link>
    </div>
  );

  if (total === 0) {
    return (
      <>
        {banner}
        <p className="empty">This course has no lessons yet. Add one in the course builder.</p>
      </>
    );
  }

  const index = Math.min(total, Math.max(1, Number(sp.lesson) || 1)) - 1;
  const l = draft.lessons[index];
  const lessonChecklist = (draft.checklist ?? []).filter((c) => c.lessonKey === l.key);
  const view: LessonView = {
    enrolmentId: "preview",
    courseVersionId: "",
    courseId: id,
    courseTitle: course.title,
    isDemo: course.isDemo,
    lesson: {
      id: String(index),
      position: index + 1,
      title: l.title || `Lesson ${index + 1} (no title yet)`,
      objectives: l.objectives,
      notes: l.notes.trim() || null,
      videoSeconds: l.kind === "reading" ? Math.max(1, l.estimatedMinutes ?? 5) * 60 : Math.max(1, l.videoSeconds),
      requiredWatchPercent: l.requiredWatchPercent,
      passPercent: l.passPercent,
      hasQuiz: l.hasQuiz && l.questions.length > 0,
      kind: l.kind,
      readingBody: l.kind === "reading" ? l.readingBody : null,
      hasChecklist: lessonChecklist.length > 0,
      isTask: l.kind === "reading" && l.isTask,
    },
    video: l.kind === "reading" ? { kind: "placeholder" } : await resolveVideo(l.videoRef),
    state: "available",
    steps: draft.lessons.map((d, i) => ({ lessonId: String(i), position: i + 1, title: d.title || `Lesson ${i + 1}`, state: "available" })),
    lessonCount: total,
    progress: { positionSeconds: 0, ranges: [], watchedSeconds: 0, quizUnlocked: false },
    questions: previewQuestions(l),
    attempts: { count: 0, bestPercent: null },
    nextLessonId: index + 1 < total ? String(index + 1) : null,
    resources: await signDownloads(l.downloads.map((f) => ({ id: f.key, title: f.title, kind: f.kind, path: f.ref, sizeBytes: f.sizeBytes }))),
  };
  const href = (i: number) => `/admin/courses/${id}/preview?lesson=${i + 1}`;

  return (
    <div className="lesson-page" id="lesson-top">
      {banner}
      <div className="page-head">
        <div>
          <Link className="crumb" href={`/admin/courses/${id}`}>← Course builder</Link>
          <div className="eyebrow" style={{ marginTop: 6 }}>
            Lesson {index + 1} of {total}
            {course.isDemo && <> <span className="demo">Demo content</span></>}
          </div>
          <h1>{view.lesson.title}</h1>
        </div>
      </div>

      <div className="lesson-layout">
        <div className="lesson-col">
          <LessonLinks notes={view.lesson.notes} downloads={view.resources} />
          {/* key resets the player and quiz when moving between lessons */}
          <LessonClient key={index} view={view} preview={{ courseId: id, lessonIndex: index }} />

          {lessonChecklist.length > 0 && (
            <section className="card" aria-labelledby="lesson-checklist-title">
              <div className="ov-card-head">
                <h2 id="lesson-checklist-title" style={{ fontSize: 18 }}>Checklist</h2>
                <span className="hint">Preview: ticks aren&apos;t saved.</span>
              </div>
              <CourseChecklist key={`c${index}`} preview sections={groupDraft(lessonChecklist)} />
            </section>
          )}

          {(view.lesson.objectives.length > 0 || view.lesson.notes) && (
            <section className="card lesson-info">
              {view.lesson.objectives.length > 0 && (
                <>
                  <h2>What you'll learn</h2>
                  <ul className="objectives">{view.lesson.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
                </>
              )}
              {view.lesson.notes && (
                <>
                  <h2>Notes</h2>
                  <p className="notes"><LinkedText text={view.lesson.notes} /></p>
                </>
              )}
            </section>
          )}
        </div>

        <aside className="lesson-side card" aria-label="Lessons in this course">
          <h2>{course.title}</h2>
          <p className="muted" style={{ fontSize: 13, margin: "0 0 10px" }}>
            In preview every lesson is open. Staff unlock them one at a time by passing each quiz.
          </p>
          <ol className="side-steps">
            {view.steps.map((s, i) => (
              <li key={s.lessonId} className={i === index ? "current" : ""}>
                <Link className="side-link" href={href(i)} aria-current={i === index ? "page" : undefined}>
                  <span className="side-dot available" aria-hidden="true">{s.position}</span>
                  <span className="side-title">{s.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { publishCourse, saveCourseDraft, type ActionState } from "@/lib/admin/actions";
import {
  correctNeeded,
  emptyLesson,
  emptyQuestion,
  publishProblems,
  type CourseDraft,
  type DraftLesson,
  type DraftQuestion,
} from "@/lib/admin/draft";

interface Props {
  courseId: string;
  initialTitle: string;
  initialDescription: string;
  initialDraft: CourseDraft;
  latestVersion: number | null;
}

export function CourseEditor({ courseId, initialTitle, initialDescription, initialDraft, latestVersion }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [draft, setDraft] = useState<CourseDraft>(initialDraft);
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<ActionState | null>(null);
  const [pending, startTransition] = useTransition();
  const [openKey, setOpenKey] = useState<string | null>(initialDraft.lessons[0]?.key ?? null);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function change(updater: (d: CourseDraft) => CourseDraft) {
    setDraft((d) => updater(d));
    setDirty(true);
    setResult(null);
  }

  const updateLesson = (key: string, patch: Partial<DraftLesson>) =>
    change((d) => ({ lessons: d.lessons.map((l) => (l.key === key ? { ...l, ...patch } : l)) }));

  const updateQuestion = (lessonKey: string, qKey: string, patch: Partial<DraftQuestion>) =>
    change((d) => ({
      lessons: d.lessons.map((l) =>
        l.key === lessonKey ? { ...l, questions: l.questions.map((q) => (q.key === qKey ? { ...q, ...patch } : q)) } : l,
      ),
    }));

  function addLesson() {
    const l = emptyLesson();
    change((d) => ({ lessons: [...d.lessons, l] }));
    setOpenKey(l.key);
  }

  function moveLesson(key: string, dir: -1 | 1) {
    change((d) => {
      const i = d.lessons.findIndex((l) => l.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= d.lessons.length) return d;
      const lessons = [...d.lessons];
      [lessons[i], lessons[j]] = [lessons[j], lessons[i]];
      return { lessons };
    });
  }

  function removeLesson(key: string) {
    const l = draft.lessons.find((x) => x.key === key);
    const label = l?.title ? `"${l.title}"` : "this lesson";
    if (!window.confirm(`Remove ${label}? Its quiz questions are removed too.`)) return;
    change((d) => ({ lessons: d.lessons.filter((x) => x.key !== key) }));
  }

  function save() {
    startTransition(async () => {
      const r = await saveCourseDraft(courseId, { title, description }, draft);
      setResult(r);
      if (r.ok) setDirty(false);
    });
  }

  function publish() {
    startTransition(async () => {
      const r = await publishCourse(courseId, { title, description }, draft);
      setResult(r);
      if (r.ok) setDirty(false);
    });
  }

  const problems = publishProblems(draft);
  if (!title.trim()) problems.unshift("Give the course a title.");

  return (
    <div className="editor">
      <section className="card form-stack">
        <div className="field">
          <label htmlFor="courseTitle">Course title</label>
          <input id="courseTitle" value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }} />
        </div>
        <div className="field">
          <label htmlFor="courseDescription">Short description</label>
          <textarea id="courseDescription" rows={2} value={description} onChange={(e) => { setDescription(e.target.value); setDirty(true); }} />
        </div>
      </section>

      <div className="sec-head" style={{ marginBottom: 0 }}>
        <div>
          <h2>Lessons</h2>
          <p>Learners take these in order. Each has a video and a quiz they must pass to unlock the next.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={addLesson}>+ Add lesson</button>
      </div>

      {draft.lessons.length === 0 && <div className="card empty">No lessons yet. Add the first one.</div>}

      {draft.lessons.map((lesson, i) => (
        <LessonEditor
          key={lesson.key}
          lesson={lesson}
          index={i}
          count={draft.lessons.length}
          open={openKey === lesson.key}
          onToggle={(open) => setOpenKey(open ? lesson.key : null)}
          onChange={(patch) => updateLesson(lesson.key, patch)}
          onQuestionChange={(qKey, patch) => updateQuestion(lesson.key, qKey, patch)}
          onAddQuestion={() => updateLesson(lesson.key, { questions: [...lesson.questions, emptyQuestion()] })}
          onRemoveQuestion={(qKey) => updateLesson(lesson.key, { questions: lesson.questions.filter((q) => q.key !== qKey) })}
          onMove={(dir) => moveLesson(lesson.key, dir)}
          onRemove={() => removeLesson(lesson.key)}
        />
      ))}

      {result?.error && (
        <div className="notice error" role="alert">
          {result.error}
          {result.problems && <ul>{result.problems.map((p) => <li key={p}>{p}</li>)}</ul>}
        </div>
      )}
      {result?.ok && <div className="notice ok" role="status">{result.message}</div>}

      <div className="savebar">
        <span className="status-text">
          {pending ? "Working…" : dirty ? "Unsaved changes" : latestVersion ? `Published as version ${latestVersion}` : "Not published yet"}
          {!pending && problems.length > 0 && ` · ${problems.length} thing${problems.length === 1 ? "" : "s"} to fix before publishing`}
        </span>
        <div className="actions-row">
          <button type="button" className="btn btn-ghost" onClick={save} disabled={pending || !dirty}>Save draft</button>
          <button type="button" className="btn btn-primary" onClick={publish} disabled={pending}>
            {latestVersion ? `Publish version ${latestVersion + 1}` : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LessonEditor({
  lesson, index, count, open, onToggle, onChange, onQuestionChange, onAddQuestion, onRemoveQuestion, onMove, onRemove,
}: {
  lesson: DraftLesson;
  index: number;
  count: number;
  open: boolean;
  onToggle: (open: boolean) => void;
  onChange: (patch: Partial<DraftLesson>) => void;
  onQuestionChange: (qKey: string, patch: Partial<DraftQuestion>) => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (qKey: string) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const id = (s: string) => `${lesson.key}-${s}`;
  const minutes = Math.floor(lesson.videoSeconds / 60);
  const seconds = lesson.videoSeconds % 60;
  const filledQuestions = lesson.questions.filter((q) => q.prompt.trim()).length;
  const needed = correctNeeded(lesson.questions.length, lesson.passPercent);

  return (
    <details className="lesson-card" open={open} onToggle={(e) => onToggle((e.currentTarget as HTMLDetailsElement).open)}>
      <summary>
        <span className="lesson-num">{index + 1}</span>
        <span className={`lesson-title${lesson.title ? "" : " placeholder"}`}>{lesson.title || "Untitled lesson"}</span>
        <span className="lesson-meta">
          {lesson.videoSeconds ? `${minutes}:${String(seconds).padStart(2, "0")} video · ` : ""}
          {filledQuestions} question{filledQuestions === 1 ? "" : "s"}
        </span>
      </summary>

      <div className="lesson-body">
        <div className="field">
          <label htmlFor={id("title")}>Lesson title</label>
          <input id={id("title")} value={lesson.title} onChange={(e) => onChange({ title: e.target.value })} />
        </div>

        <div className="field">
          <label htmlFor={id("objectives")}>What they'll learn</label>
          <textarea
            id={id("objectives")}
            rows={3}
            value={lesson.objectives.join("\n")}
            onChange={(e) => onChange({ objectives: e.target.value.split("\n") })}
          />
          <p className="hint">One point per line. The first line shows on the dashboard.</p>
        </div>

        <div className="form-row">
          <div className="field" style={{ gridColumn: "span 2" }}>
            <label htmlFor={id("video")}>Video link</label>
            <input id={id("video")} value={lesson.videoRef} placeholder="Add once videos are ready" onChange={(e) => onChange({ videoRef: e.target.value })} />
          </div>
          <div className="field">
            <span className="label" id={id("lenlabel")}>Video length</span>
            <div className="option-row" role="group" aria-labelledby={id("lenlabel")}>
              <input className="input" type="number" min={0} aria-label="Minutes" value={minutes || ""} placeholder="min"
                onChange={(e) => onChange({ videoSeconds: Math.max(0, Number(e.target.value) || 0) * 60 + seconds })} />
              <input className="input" type="number" min={0} max={59} aria-label="Seconds" value={seconds || ""} placeholder="sec"
                onChange={(e) => onChange({ videoSeconds: minutes * 60 + Math.min(59, Math.max(0, Number(e.target.value) || 0)) })} />
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor={id("watch")}>Watch before quiz (%)</label>
            <input id={id("watch")} type="number" min={1} max={100} value={lesson.requiredWatchPercent}
              onChange={(e) => onChange({ requiredWatchPercent: Math.min(100, Math.max(1, Number(e.target.value) || 1)) })} />
          </div>
          <div className="field">
            <label htmlFor={id("pass")}>Pass mark (%)</label>
            <input id={id("pass")} type="number" min={1} max={100} value={lesson.passPercent}
              onChange={(e) => onChange({ passPercent: Math.min(100, Math.max(1, Number(e.target.value) || 1)) })} />
          </div>
          <div className="field">
            <label htmlFor={id("mins")}>Time to complete (min)</label>
            <input id={id("mins")} type="number" min={1} value={lesson.estimatedMinutes ?? ""}
              onChange={(e) => onChange({ estimatedMinutes: e.target.value ? Math.max(1, Number(e.target.value)) : null })} />
          </div>
        </div>

        <label className="check">
          <input type="checkbox" checked={lesson.isRequired} onChange={(e) => onChange({ isRequired: e.target.checked })} />
          Required to complete the course
        </label>

        <div className="field">
          <label htmlFor={id("notes")}>Lesson notes</label>
          <textarea id={id("notes")} rows={3} value={lesson.notes} onChange={(e) => onChange({ notes: e.target.value })} />
        </div>

        <div className="sec-head" style={{ marginBottom: 0 }}>
          <div>
            <h3 style={{ fontSize: 16 }}>Quiz</h3>
            <p style={{ fontSize: 13 }}>
              {lesson.questions.length
                ? `With ${lesson.questions.length} question${lesson.questions.length === 1 ? "" : "s"} and a ${lesson.passPercent}% pass mark, learners need ${needed} correct.`
                : "Add at least one question."}
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onAddQuestion}>+ Add question</button>
        </div>

        {lesson.questions.map((q, qi) => (
          <div key={q.key} className="question">
            <div className="question-head">
              <span>Question {qi + 1}</span>
              <button type="button" className="mini danger" onClick={() => onRemoveQuestion(q.key)}>Remove question</button>
            </div>
            <div className="field">
              <label htmlFor={`${q.key}-prompt`} className="sr-only">Question text</label>
              <input id={`${q.key}-prompt`} placeholder="Question" value={q.prompt} onChange={(e) => onQuestionChange(q.key, { prompt: e.target.value })} />
            </div>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="form-stack">
              <legend className="hint" style={{ marginBottom: 8 }}>Answers. Select the correct one.</legend>
              {q.options.map((opt, oi) => (
                <div key={oi} className="option-row">
                  <input
                    type="radio"
                    name={`${q.key}-correct`}
                    checked={q.correctIndex === oi}
                    onChange={() => onQuestionChange(q.key, { correctIndex: oi })}
                    aria-label={`Mark answer ${oi + 1} as correct`}
                  />
                  <input
                    className="input"
                    placeholder={`Answer ${oi + 1}`}
                    value={opt}
                    onChange={(e) => onQuestionChange(q.key, { options: q.options.map((o, j) => (j === oi ? e.target.value : o)) })}
                  />
                  {q.options.length > 2 && (
                    <button
                      type="button"
                      className="mini danger"
                      aria-label={`Remove answer ${oi + 1}`}
                      onClick={() =>
                        onQuestionChange(q.key, {
                          options: q.options.filter((_, j) => j !== oi),
                          correctIndex: q.correctIndex === oi ? 0 : q.correctIndex > oi ? q.correctIndex - 1 : q.correctIndex,
                        })
                      }
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </fieldset>
            {q.options.length < 6 && (
              <button type="button" className="mini" style={{ alignSelf: "flex-start" }} onClick={() => onQuestionChange(q.key, { options: [...q.options, ""] })}>
                + Add answer
              </button>
            )}
            <div className="field">
              <label htmlFor={`${q.key}-expl`}>Explanation shown after answering</label>
              <input id={`${q.key}-expl`} value={q.explanation} onChange={(e) => onQuestionChange(q.key, { explanation: e.target.value })} />
            </div>
          </div>
        ))}

        <div className="actions-row" style={{ justifyContent: "space-between", borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <div className="actions-row">
            <button type="button" className="mini" onClick={() => onMove(-1)} disabled={index === 0}>↑ Move up</button>
            <button type="button" className="mini" onClick={() => onMove(1)} disabled={index === count - 1}>↓ Move down</button>
          </div>
          <button type="button" className="mini danger" onClick={onRemove}>Remove lesson</button>
        </div>
      </div>
    </details>
  );
}

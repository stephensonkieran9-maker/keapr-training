"use client";

import { useEffect, useState, useTransition } from "react";
import { createFileUpload, createVideoUpload, publishCourse, saveCourseDraft, type ActionState } from "@/lib/admin/actions";
import { getBrowserClient } from "@/lib/supabase/browser";
import {
  checklistFromText,
  checklistToText,
  mergeChecklist,
  correctNeeded,
  downloadKind,
  emptyLesson,
  newKey,
  emptyQuestion,
  publishProblems,
  type CourseDraft,
  type DraftChecklistItem,
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
    change((d) => ({ ...d, lessons: d.lessons.map((l) => (l.key === key ? { ...l, ...patch } : l)) }));

  const updateQuestion = (lessonKey: string, qKey: string, patch: Partial<DraftQuestion>) =>
    change((d) => ({
      ...d,
      lessons: d.lessons.map((l) =>
        l.key === lessonKey ? { ...l, questions: l.questions.map((q) => (q.key === qKey ? { ...q, ...patch } : q)) } : l,
      ),
    }));

  function addLesson() {
    const l = emptyLesson();
    change((d) => ({ ...d, lessons: [...d.lessons, l] }));
    setOpenKey(l.key);
  }

  function moveLesson(key: string, dir: -1 | 1) {
    change((d) => {
      const i = d.lessons.findIndex((l) => l.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= d.lessons.length) return d;
      const lessons = [...d.lessons];
      [lessons[i], lessons[j]] = [lessons[j], lessons[i]];
      return { ...d, lessons };
    });
  }

  function removeLesson(key: string) {
    const l = draft.lessons.find((x) => x.key === key);
    const label = l?.title ? `"${l.title}"` : "this lesson";
    if (!window.confirm(`Remove ${label}? Its quiz questions are removed too.`)) return;
    change((d) => ({ ...d, lessons: d.lessons.filter((x) => x.key !== key) }));
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
          <p>Learners take these in order. Each has a video or reading, and usually a quiz they must pass to unlock the next.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={addLesson}>+ Add lesson</button>
      </div>

      {draft.lessons.length === 0 && <div className="card empty">No lessons yet. Add the first one.</div>}

      {draft.lessons.map((lesson, i) => (
        <LessonEditor
          key={lesson.key}
          courseId={courseId}
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
          checklist={(draft.checklist ?? []).filter((c) => c.lessonKey === lesson.key)}
          onChecklistChange={(items) => change((d) => ({ ...d, checklist: mergeChecklist(d.checklist, lesson.key, items) }))}
        />
      ))}

      <section className="card form-stack" aria-labelledby="checklist-title">
        <div>
          <h2 id="checklist-title" style={{ fontSize: 18, margin: 0 }}>Checklist (optional)</h2>
          <p className="hint" style={{ margin: "4px 0 0" }}>
            Tick boxes for things done outside the app (reading out loud, recordings, roleplays). Every item shows on the course page;
            items added inside a lesson also show on that lesson. Learners tick them off themselves; you can see their ticks on their
            Staff page. Ticks don&apos;t lock or unlock anything.
          </p>
        </div>
        <ChecklistField
          id="courseChecklist"
          label="Course page checklist items"
          items={(draft.checklist ?? []).filter((c) => !c.lessonKey)}
          onChange={(items) => change((d) => ({ ...d, checklist: mergeChecklist(d.checklist, undefined, items) }))}
        />
      </section>

      {result?.error && (
        <div className="notice error" role="alert">
          {result.error}
          {result.problems && <ul>{result.problems.map((p) => <li key={p}>{p}</li>)}</ul>}
        </div>
      )}
      {result?.ok && <div className="notice ok" role="status">{result.message}</div>}

      <div className="savebar">
        <span className="status-text">
          {pending ? "Working…" : dirty ? "Unsaved changes (save to see them in Preview)" : latestVersion ? `Published as version ${latestVersion}` : "Not published yet"}
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
  courseId, lesson, index, count, open, onToggle, onChange, onQuestionChange, onAddQuestion, onRemoveQuestion, onMove, onRemove,
  checklist, onChecklistChange,
}: {
  checklist: DraftChecklistItem[];
  onChecklistChange: (items: DraftChecklistItem[]) => void;
  courseId: string;
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
  const isReading = lesson.kind === "reading";

  return (
    <details className="lesson-card" open={open} onToggle={(e) => onToggle((e.currentTarget as HTMLDetailsElement).open)}>
      <summary>
        <span className="lesson-num">{index + 1}</span>
        <span className={`lesson-title${lesson.title ? "" : " placeholder"}`}>{lesson.title || "Untitled lesson"}</span>
        <span className="lesson-meta">
          {isReading
            ? `Reading${lesson.estimatedMinutes ? `, ${lesson.estimatedMinutes} min` : ""} · `
            : lesson.videoSeconds ? `${minutes}:${String(seconds).padStart(2, "0")} video · ` : ""}
          {lesson.hasQuiz ? `${filledQuestions} question${filledQuestions === 1 ? "" : "s"}` : isReading ? "Read only, no quiz" : "Watch only, no quiz"}
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

        <div className="field">
          <span className="label" id={id("kindlabel")}>Lesson type</span>
          <div className="option-row" role="radiogroup" aria-labelledby={id("kindlabel")}>
            <label className="check">
              <input type="radio" name={id("kind")} checked={!isReading} onChange={() => onChange({ kind: "video" })} />
              Video
            </label>
            <label className="check">
              <input type="radio" name={id("kind")} checked={isReading} onChange={() => onChange({ kind: "reading" })} />
              Reading (no video)
            </label>
          </div>
          {isReading && (
            <p className="hint">Staff read the text below, tick &quot;I&apos;ve read this&quot;, then take the quiz. Attach the full document under Downloads if they need it too.</p>
          )}
        </div>

        {isReading && (
          <div className="field">
            <label htmlFor={id("reading")}>Reading text</label>
            <textarea id={id("reading")} rows={14} value={lesson.readingBody} onChange={(e) => onChange({ readingBody: e.target.value })} />
            <p className="hint">Leave a blank line between paragraphs. Start a line with &quot;# &quot; for a heading, or &quot;- &quot; for a bullet point.</p>
          </div>
        )}

        {!isReading && (
        <div className="form-row">
          <div className="field" style={{ gridColumn: "span 2" }}>
            <span className="label">Video</span>
            <VideoUpload courseId={courseId} lesson={lesson} onUploaded={(ref, secs) => onChange({ videoRef: ref, videoSeconds: secs || lesson.videoSeconds })} />
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
        )}

        <div className="form-row">
          {!isReading && (
          <div className="field">
            <label htmlFor={id("watch")}>{lesson.hasQuiz ? "Watch before quiz (%)" : "Watch to complete (%)"}</label>
            <input id={id("watch")} type="number" min={1} max={100} value={lesson.requiredWatchPercent}
              onChange={(e) => onChange({ requiredWatchPercent: Math.min(100, Math.max(1, Number(e.target.value) || 1)) })} />
          </div>
          )}
          {lesson.hasQuiz && (
            <div className="field">
              <label htmlFor={id("pass")}>Pass mark (%)</label>
              <input id={id("pass")} type="number" min={1} max={100} value={lesson.passPercent}
                onChange={(e) => onChange({ passPercent: Math.min(100, Math.max(1, Number(e.target.value) || 1)) })} />
            </div>
          )}
          <div className="field">
            <label htmlFor={id("mins")}>{isReading ? "Reading time (min)" : "Time to complete (min)"}</label>
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
          <p className="hint">Web links here become buttons at the top of the lesson. Put a short label on the line above the link.</p>
        </div>

        <div className="field">
          <span className="label">Downloads</span>
          <DownloadsEditor courseId={courseId} lesson={lesson} onChange={(downloads) => onChange({ downloads })} />
        </div>

        <ChecklistField
          id={id("checklist")}
          label="Checklist for this lesson (optional)"
          items={checklist}
          lessonKey={lesson.key}
          onChange={onChecklistChange}
        />

        <label className="check">
          <input
            type="checkbox"
            checked={lesson.hasQuiz}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? { hasQuiz: true, questions: lesson.questions.length ? lesson.questions : [emptyQuestion()] }
                  : { hasQuiz: false, requiredWatchPercent: 100 },
              )
            }
          />
          This lesson has a quiz
        </label>
        {!lesson.hasQuiz && isReading && (
          <p className="hint" style={{ margin: 0 }}>
            Read only: the lesson completes once they confirm they&apos;ve read it.
          </p>
        )}
        {!lesson.hasQuiz && !isReading && (
          <p className="hint" style={{ margin: 0 }}>
            Watch only: the lesson completes once they&apos;ve watched {lesson.requiredWatchPercent >= 100 ? "the whole video" : `${lesson.requiredWatchPercent}% of the video`}. Skipping ahead doesn&apos;t count.
            {lesson.questions.some((q) => q.prompt.trim()) ? " Questions you'd written are kept in the draft but not published." : ""}
          </p>
        )}

        {lesson.hasQuiz && (<>
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
        </>)}

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

const MAX_UPLOAD_MB = 50;

/** Checklist edited as text: one item per line, "# " lines are headings. */
function ChecklistField({ id, label, items, lessonKey, onChange }: {
  id: string; label: string; items: DraftChecklistItem[]; lessonKey?: string; onChange: (items: DraftChecklistItem[]) => void;
}) {
  const [text, setText] = useState(() => checklistToText(items));
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        rows={lessonKey ? 5 : 8}
        value={text}
        placeholder={"# Day 1 · Orientation\nRead the full script once, top to bottom"}
        onChange={(e) => {
          setText(e.target.value);
          onChange(checklistFromText(e.target.value, items, lessonKey));
        }}
      />
      <p className="hint">
        One tick box per line. Start a line with &quot;# &quot; for a heading. {items.length} item{items.length === 1 ? "" : "s"}.
        {lessonKey ? " Shown on this lesson and the course page; ticks don't lock anything." : ""}
      </p>
    </div>
  );
}

function VideoUpload({ courseId, lesson, onUploaded }: { courseId: string; lesson: DraftLesson; onUploaded: (ref: string, seconds: number) => void }) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const id = `${lesson.key}-file`;
  const hasVideo = lesson.videoRef.startsWith("storage:") || /^https:\/\//.test(lesson.videoRef);
  const label = lesson.videoRef.startsWith("storage:") ? lesson.videoRef.split("/").pop()?.replace(/^\d+-/, "") : lesson.videoRef;

  async function handle(file: File) {
    setError(null);
    if (!file.type.startsWith("video/")) return setError("Choose a video file (MP4 works best).");
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      return setError(`That file is ${(file.size / 1048576).toFixed(0)} MB. Videos need to be under ${MAX_UPLOAD_MB} MB on the current Supabase plan. Export at 720p to make it smaller.`);
    }
    setBusy(true);
    setStatus("Reading video length…");
    const seconds = await readDuration(file);
    setStatus("Uploading…");
    const ticket = await createVideoUpload(courseId, file.name);
    if (!ticket.ok || !ticket.path || !ticket.token) {
      setBusy(false);
      setStatus(null);
      return setError(ticket.error ?? "Upload couldn't start.");
    }
    const { error: upErr } = await getBrowserClient().storage.from("lesson-videos").uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type });
    setBusy(false);
    if (upErr) {
      setStatus(null);
      return setError(`Upload failed: ${upErr.message}`);
    }
    onUploaded(`storage:lesson-videos/${ticket.path}`, Math.round(seconds));
    setStatus("Uploaded. Save the draft and publish to make it live.");
  }

  return (
    <div className="form-stack" style={{ gap: 8 }}>
      <div className="option-row">
        <span className="input" style={{ color: hasVideo ? "var(--fg)" : "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {hasVideo ? label : "No video yet. Learners see a placeholder."}
        </span>
        <label htmlFor={id} className={`btn btn-ghost btn-sm${busy ? " disabled" : ""}`} style={{ cursor: busy ? "wait" : "pointer" }}>
          {busy ? "Uploading…" : hasVideo ? "Replace" : "Upload video"}
        </label>
        <input id={id} type="file" accept="video/*" className="sr-only" disabled={busy}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void handle(f); e.target.value = ""; }} />
      </div>
      {status && !error && <p className="hint">{status}</p>}
      {error && <p className="hint" style={{ color: "#9a3326" }} role="alert">{error}</p>}
    </div>
  );
}

const ACCEPT_FILES = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.png,.jpg,.jpeg";

/** Files learners can download from the top of the lesson (an invoice, a checklist). */
function DownloadsEditor({ courseId, lesson, onChange }: { courseId: string; lesson: DraftLesson; onChange: (d: DraftLesson["downloads"]) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = `${lesson.key}-download`;
  const downloads = lesson.downloads ?? [];

  async function handle(file: File) {
    setError(null);
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return setError(`That file is ${(file.size / 1048576).toFixed(0)} MB. Files need to be under ${MAX_UPLOAD_MB} MB.`);
    setBusy(true);
    const ticket = await createFileUpload(courseId, file.name);
    if (!ticket.ok || !ticket.path || !ticket.token) {
      setBusy(false);
      return setError(ticket.error ?? "Upload couldn't start.");
    }
    const { error: upErr } = await getBrowserClient().storage.from("lesson-files").uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type || undefined });
    setBusy(false);
    if (upErr) return setError(`Upload failed: ${upErr.message}`);
    const title = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
    onChange([...downloads, { key: newKey("f"), title, ref: ticket.path, sizeBytes: file.size, kind: downloadKind(file.name) }]);
  }

  return (
    <div className="form-stack" style={{ gap: 8 }}>
      {downloads.map((f) => (
        <div key={f.key} className="option-row">
          <input
            className="input"
            aria-label="Button label"
            value={f.title}
            onChange={(e) => onChange(downloads.map((d) => (d.key === f.key ? { ...d, title: e.target.value } : d)))}
          />
          <span className="hint" style={{ whiteSpace: "nowrap" }}>{f.sizeBytes ? `${Math.max(1, Math.round(f.sizeBytes / 1024))} KB` : ""}</span>
          <button type="button" className="mini danger" onClick={() => onChange(downloads.filter((d) => d.key !== f.key))}>Remove</button>
        </div>
      ))}
      <div className="option-row">
        <label htmlFor={id} className={`btn btn-ghost btn-sm${busy ? " disabled" : ""}`} style={{ cursor: busy ? "wait" : "pointer" }}>
          {busy ? "Uploading…" : "+ Upload file"}
        </label>
        <input id={id} type="file" accept={ACCEPT_FILES} className="sr-only" disabled={busy}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void handle(f); e.target.value = ""; }} />
        <span className="hint">{downloads.length ? "Shown as Download buttons at the top of the lesson. Edit the label if you like." : "PDF, Word, Excel or images. Shown as a Download button at the top of the lesson."}</span>
      </div>
      {error && <p className="hint" style={{ color: "#9a3326" }} role="alert">{error}</p>}
    </div>
  );
}

function readDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(Number.isFinite(v.duration) ? v.duration : 0); };
    v.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
    v.src = url;
  });
}

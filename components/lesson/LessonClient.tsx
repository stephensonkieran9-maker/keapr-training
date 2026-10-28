"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/Icons";
import { confirmReading, submitQuiz, type QuizResult } from "@/lib/lesson-actions";
import { LinkedText } from "@/components/LinkedText";
import { previewQuiz } from "@/lib/admin/preview-actions";
import { formatDuration } from "@/lib/format";
import type { LessonQuestion, LessonView } from "@/lib/lesson";
import { useWatchTracker } from "./useWatchTracker";

/** Admin preview: nothing is saved and links stay inside the preview. */
export interface PreviewMode {
  courseId: string;
  lessonIndex: number;
}

function lessonHref(id: string, preview?: PreviewMode) {
  return preview ? `/admin/courses/${preview.courseId}/preview?lesson=${Number(id) + 1}` : `/lessons/${id}`;
}

export function LessonClient({ view, preview }: { view: LessonView; preview?: PreviewMode }) {
  if (view.lesson.kind === "reading") return <ReadingLesson view={view} preview={preview} />;
  return <VideoLesson view={view} preview={preview} />;
}

function VideoLesson({ view, preview }: { view: LessonView; preview?: PreviewMode }) {
  const { lesson } = view;
  const tracker = useWatchTracker({
    preview: Boolean(preview),
    lessonId: lesson.id,
    duration: lesson.videoSeconds,
    requiredRatio: lesson.requiredWatchPercent / 100,
    initialRanges: view.progress.ranges,
    initialUnlocked: view.progress.quizUnlocked || view.state === "passed",
  });
  const watchedPct = Math.min(100, Math.round((tracker.watched / Math.max(1, lesson.videoSeconds)) * 100));
  const needed = lesson.requiredWatchPercent;

  return (
    <div className="lesson-main">
      <div className="player-wrap">
        {view.video.kind === "file" ? (
          <FilePlayer src={view.video.src} startAt={view.progress.positionSeconds} duration={lesson.videoSeconds} tracker={tracker} />
        ) : (
          <PlaceholderPlayer duration={lesson.videoSeconds} startAt={view.progress.positionSeconds} tracker={tracker} title={lesson.title} />
        )}
      </div>

      <div className="watch-meter" aria-live="polite">
        <div className="progress-label">
          <span>Watched {formatDuration(tracker.watched)} of {formatDuration(lesson.videoSeconds)}</span>
          <span>
            {tracker.unlocked
              ? lesson.hasQuiz ? "Quiz unlocked" : "Watched"
              : needed >= 100 ? `${watchedPct}% · watch it all to finish` : `${watchedPct}% of ${needed}% needed`}
          </span>
        </div>
        <div className="bar watch-bar" role="progressbar" aria-valuenow={watchedPct} aria-valuemin={0} aria-valuemax={100} aria-label="Video watched">
          <i style={{ width: `${watchedPct}%` }} />
          <b style={{ left: `${needed}%` }} aria-hidden="true" />
        </div>
        {tracker.saveError && <p className="form-error" role="alert" style={{ marginTop: 8 }}>{tracker.saveError}</p>}
        {preview && !tracker.unlocked && (
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={tracker.unlock}>
            {lesson.hasQuiz ? "Skip to the quiz (preview only)" : "Skip to the end (preview only)"}
          </button>
        )}
      </div>

      {lesson.hasQuiz ? (
        <Quiz view={view} unlocked={tracker.unlocked} preview={preview} />
      ) : (
        <WatchToComplete view={view} tracker={tracker} preview={preview} />
      )}
    </div>
  );
}

type Tracker = ReturnType<typeof useWatchTracker>;
type Completion = Tracker["completion"];

/** Reading lessons: the text, an "I've read this" confirmation (checked on the
 * server), then the quiz. With no quiz, confirming completes the lesson. */
function ReadingLesson({ view, preview }: { view: LessonView; preview?: PreviewMode }) {
  const { lesson } = view;
  const [confirmed, setConfirmed] = useState(view.progress.quizUnlocked || view.state === "passed");
  const [completion, setCompletion] = useState<Completion>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // A reading lesson with no quiz but its own checklist is a list of tasks.
  const taskLesson = !lesson.hasQuiz && Boolean(lesson.hasChecklist);
  const isTask = Boolean(lesson.isTask);

  function confirm() {
    setError(null);
    if (preview) {
      setConfirmed(true);
      return;
    }
    start(async () => {
      const r = await confirmReading(lesson.id);
      if (!r.ok) {
        setError(r.error ?? "That didn't save. Try again.");
        return;
      }
      setConfirmed(true);
      if (r.lessonCompleted) {
        setCompletion({ nextLessonId: r.nextLessonId ?? null, courseCompleted: Boolean(r.courseCompleted), nextCourse: r.nextCourse ?? null });
      }
    });
  }

  return (
    <div className="lesson-main">
      <article className="card reading" aria-label="Reading">
        <span className="tag">{isTask ? "Task" : "Reading"} · about {Math.max(1, Math.round(lesson.videoSeconds / 60))} min</span>
        <ReadingText text={lesson.readingBody ?? ""} />
      </article>

      {!confirmed && isTask ? (
        <section className="card task-tick" aria-live="polite">
          <label className={`task-check${pending ? " saving" : ""}`}>
            <input type="checkbox" checked={pending} disabled={pending} onChange={confirm} />
            <span>
              <b>{pending ? "Saving…" : "I've done this"}</b>
              <small>{lesson.hasQuiz ? "Tick when you've done everything above. It unlocks the quiz." : "Tick when you've done everything above. It unlocks the next lesson."}</small>
            </span>
          </label>
          {error && <p className="form-error" role="alert" style={{ marginTop: 8 }}>{error}</p>}
        </section>
      ) : !confirmed ? (
        <section className="card quiz quiz-locked" aria-live="polite">
          <span className="lock-badge" aria-hidden="true"><Icon name="lock" /></span>
          <div>
            <h2>{lesson.hasQuiz ? "Read everything above to unlock the quiz" : taskLesson ? "Mark this lesson as done when you've finished" : "Read everything above to finish this lesson"}</h2>
            <p className="muted">
              {taskLesson
                ? "Tick off the checklist below as you go, then mark the lesson as done."
                : "Include any downloads attached to this lesson. Confirm once you've read it all."}
            </p>
            {error && <p className="form-error" role="alert" style={{ marginTop: 8 }}>{error}</p>}
            <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={confirm} disabled={pending}>
              {pending ? "Saving…" : taskLesson ? "Mark lesson as done" : "I've read this"}
            </button>
          </div>
        </section>
      ) : lesson.hasQuiz ? (
        <Quiz view={view} unlocked preview={preview} />
      ) : (
        <WatchToComplete view={view} tracker={{ unlocked: true, completion }} preview={preview} />
      )}
    </div>
  );
}

/** Reading text: blank lines split paragraphs, "# " lines are headings and
 * lines starting "- " are bullet lists. Web links become links. */
function ReadingText({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="reading-text">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (lines.length === 1 && /^#{1,3}\s/.test(b)) return <h3 key={i}>{b.replace(/^#{1,3}\s+/, "")}</h3>;
        if (lines.every((l) => /^\s*[-•]\s/.test(l))) {
          return <ul key={i}>{lines.map((l, j) => <li key={j}><LinkedText text={l.replace(/^\s*[-•]\s+/, "")} /></li>)}</ul>;
        }
        return <p key={i}><LinkedText text={b} /></p>;
      })}
    </div>
  );
}

/** "Next course" after finishing a course, plus a way back to the course. */
function NextCourseActions({ nextCourse, courseId }: { nextCourse: { courseId: string; title: string; lessonId: string | null }; courseId: string }) {
  return (
    <>
      <Link className="btn btn-primary" href={nextCourse.lessonId ? `/lessons/${nextCourse.lessonId}` : `/courses/${nextCourse.courseId}`}>
        Next course: {nextCourse.title}<Icon name="arrow" />
      </Link>
      <Link className="btn btn-ghost" href={`/courses/${courseId}`}>Back to course</Link>
    </>
  );
}

/** Watch-only lessons: no quiz; the lesson completes once the video is watched. */
function WatchToComplete({ view, tracker, preview }: { view: LessonView; tracker: Pick<Tracker, "unlocked" | "completion">; preview?: PreviewMode }) {
  const router = useRouter();
  const { lesson } = view;
  const done = view.state === "passed" || Boolean(tracker.completion) || (Boolean(preview) && tracker.unlocked);
  const nextId = tracker.completion ? tracker.completion.nextLessonId : view.nextLessonId;
  const courseDone = tracker.completion?.courseCompleted ?? false;
  const justFinished = Boolean(tracker.completion) && view.state !== "passed";

  // Refresh the lesson list and dashboard once the server records completion.
  useEffect(() => {
    if (justFinished && !preview) router.refresh();
  }, [justFinished, preview, router]);

  if (!done) {
    return (
      <section className="card quiz quiz-locked" aria-live="polite">
        <span className="lock-badge" aria-hidden="true"><Icon name="play" /></span>
        <div>
          <h2>{lesson.requiredWatchPercent >= 100 ? "Watch the whole video to finish this lesson" : `Watch ${lesson.requiredWatchPercent}% of the video to finish this lesson`}</h2>
          <p className="muted">
            There&apos;s no quiz for this one. Skipping ahead doesn&apos;t count, so watch it through. Your place is saved if you need to stop.
            {tracker.unlocked && !preview ? " Saving…" : ""}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="card quiz result pass" aria-live="polite">
      <div className="result-head">
        <div className="result-score"><span className="result-num" aria-hidden="true">✓</span></div>
        <div>
          <h2>{courseDone && !nextId ? "Lesson complete. Course complete." : "Lesson complete"}</h2>
          <p className="muted">{nextId ? "The next lesson is now unlocked." : "You've finished this lesson."}</p>
        </div>
      </div>
      <div className="actions-row">
        {nextId ? (
          <Link className="btn btn-primary" href={lessonHref(nextId, preview)}>Continue to next lesson<Icon name="arrow" /></Link>
        ) : !preview && tracker.completion?.nextCourse ? (
          <NextCourseActions nextCourse={tracker.completion.nextCourse} courseId={view.courseId} />
        ) : (
          <Link className="btn btn-primary" href={preview ? `/admin/courses/${preview.courseId}` : `/courses/${view.courseId}`}>
            {preview ? "Back to course builder" : "Back to course"}<Icon name="arrow" />
          </Link>
        )}
      </div>
    </section>
  );
}

function FilePlayer({ src, startAt, duration, tracker }: { src: string; startAt: number; duration: number; tracker: Tracker }) {
  const ref = useRef<HTMLVideoElement>(null);
  return (
    <video
      ref={ref}
      className="player"
      src={src}
      controls
      playsInline
      preload="metadata"
      controlsList="nodownload"
      onLoadedMetadata={(e) => {
        const v = e.currentTarget;
        if (startAt > 2 && startAt < (v.duration || duration) - 3) v.currentTime = startAt;
        tracker.onSeek(v.currentTime);
      }}
      onTimeUpdate={(e) => tracker.onTime(e.currentTarget.currentTime, !e.currentTarget.paused)}
      onSeeking={(e) => tracker.onSeek(e.currentTarget.currentTime)}
      onPause={tracker.onPause}
      onEnded={tracker.onPause}
    />
  );
}

/** Stand-in until a real video is uploaded: a timer you can play, pause and
 * scrub, tracked exactly like a real video so the quiz gate can be tested. */
function PlaceholderPlayer({ duration, startAt, tracker, title }: { duration: number; startAt: number; tracker: Tracker; title: string }) {
  const [t, setT] = useState(() => (startAt > 2 && startAt < duration - 3 ? startAt : 0));
  const [playing, setPlaying] = useState(false);
  const tRef = useRef(t);
  const trackerRef = useRef(tracker);
  trackerRef.current = tracker;

  useEffect(() => {
    trackerRef.current.onSeek(tRef.current);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const next = Math.min(duration, tRef.current + 0.25);
      tRef.current = next;
      setT(next);
      trackerRef.current.onTime(next, true);
      if (next >= duration) {
        setPlaying(false);
        trackerRef.current.onPause();
      }
    }, 250);
    return () => clearInterval(id);
  }, [playing, duration]);

  return (
    <div className="placeholder-player">
      <div className="pp-screen">
        <span className="tag">Video coming soon</span>
        <div className="pp-title">{title}</div>
        <p>The lesson video hasn't been uploaded yet. This placeholder plays for the same length so you can try the lesson and quiz.</p>
      </div>
      <div className="pp-controls">
        <button
          type="button"
          className="pp-play"
          onClick={() => {
            if (playing) {
              setPlaying(false);
              tracker.onPause();
            } else {
              if (tRef.current >= duration) {
                tRef.current = 0;
                setT(0);
                tracker.onSeek(0);
              }
              setPlaying(true);
            }
          }}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <span className="pause-icon" aria-hidden="true" /> : <Icon name="play" />}
        </button>
        <input
          type="range"
          className="pp-scrub"
          min={0}
          max={duration}
          step={1}
          value={Math.floor(t)}
          aria-label="Seek"
          onChange={(e) => {
            const v = Number(e.target.value);
            tRef.current = v;
            setT(v);
            tracker.onSeek(v);
          }}
        />
        <span className="pp-time">{formatDuration(t)} / {formatDuration(duration)}</span>
      </div>
    </div>
  );
}

function Quiz({ view, unlocked, preview }: { view: LessonView; unlocked: boolean; preview?: PreviewMode }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [pending, start] = useTransition();
  // Options arrive shuffled from the server; Retry reshuffles them (not in admin preview).
  const [questions, setQuestions] = useState(view.questions);
  // When this attempt started (first answer picked), for admin reporting.
  const startedAt = useRef<string | null>(null);
  const { lesson } = view;
  const answered = questions.filter((q) => answers[q.id]).length;
  const needed = Math.ceil((questions.length * lesson.passPercent) / 100 - 1e-9);
  const alreadyPassed = view.state === "passed";

  if (questions.length === 0) {
    return <section className="card quiz"><h2>Quiz</h2><p className="muted">This lesson doesn't have a quiz yet.</p></section>;
  }

  if (!unlocked) {
    return (
      <section className="card quiz quiz-locked" aria-labelledby="quiz-title">
        <span className="lock-badge" aria-hidden="true"><Icon name="lock" /></span>
        <div>
          <h2 id="quiz-title">Quiz locked</h2>
          <p className="muted">Watch at least {lesson.requiredWatchPercent}% of the video to unlock the quiz. Skipping ahead doesn't count.</p>
        </div>
      </section>
    );
  }

  if (result?.ok) {
    return (
      <QuizResults
        view={view}
        result={result}
        preview={preview}
        onRetry={() => {
          setResult(null);
          setAnswers({});
          startedAt.current = null;
          if (!preview) setQuestions((qs) => qs.map((q) => ({ ...q, options: shuffled(q.options) })));
        }}
      />
    );
  }

  return (
    <section className="card quiz" aria-labelledby="quiz-title">
      <div className="quiz-head">
        <div>
          <h2 id="quiz-title">Quiz</h2>
          <p className="muted">
            {questions.length} question{questions.length === 1 ? "" : "s"}. Get {needed} right ({lesson.passPercent}%) to pass
            {view.nextLessonId ? " and unlock the next lesson" : ""}.
            {alreadyPassed ? " You've already passed this lesson; retaking won't affect that." : ""}
          </p>
        </div>
        {view.attempts.count > 0 && <span className="badge learner">Best so far {view.attempts.bestPercent}%</span>}
      </div>

      <form
        className="quiz-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (answered < questions.length) return;
          const began = startedAt.current;
          start(async () =>
            setResult(preview ? await previewQuiz(preview.courseId, preview.lessonIndex, answers) : await submitQuiz(lesson.id, answers, began)),
          );
        }}
      >
        {questions.map((q, i) => (
          <QuestionField
            key={q.id}
            q={q}
            index={i}
            value={answers[q.id]}
            onChange={(v) => {
              if (!startedAt.current) startedAt.current = new Date().toISOString();
              setAnswers((a) => ({ ...a, [q.id]: v }));
            }}
          />
        ))}
        {result && !result.ok && <p className="form-error" role="alert">{result.error}</p>}
        <div className="quiz-submit">
          <span className="muted">{answered} of {questions.length} answered</span>
          <button className="btn btn-primary" type="submit" disabled={pending || answered < questions.length}>
            {pending ? "Checking…" : "Submit answers"}
          </button>
        </div>
      </form>
    </section>
  );
}

function QuestionField({ q, index, value, onChange }: { q: LessonQuestion; index: number; value?: string; onChange: (v: string) => void }) {
  return (
    <fieldset className="q">
      <legend><span className="q-num">{index + 1}</span>{q.prompt}</legend>
      <div className="q-options">
        {q.options.map((o) => (
          <label key={o.id} className={`q-option${value === o.id ? " selected" : ""}`}>
            <input type="radio" name={q.id} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function QuizResults({ view, result, onRetry, preview }: { view: LessonView; result: QuizResult; onRetry: () => void; preview?: PreviewMode }) {
  const passed = Boolean(result.passed);
  const score = Math.floor(((result.correct ?? 0) / Math.max(1, result.total ?? 1)) * 100);
  const byId = new Map(view.questions.map((q) => [q.id, q]));

  return (
    <section className={`card quiz result ${passed ? "pass" : "fail"}`} aria-labelledby="result-title" aria-live="polite">
      <div className="result-head">
        <div className="result-score">
          <span className="result-num">{score}%</span>
          <span className="muted">{result.correct} of {result.total} correct · pass mark {result.passPercent}%</span>
        </div>
        <div>
          <h2 id="result-title">{passed ? (result.courseCompleted && !result.nextLessonId ? "Passed. Course complete." : "Passed") : "Not passed this time"}</h2>
          <p className="muted">
            {passed
              ? result.nextLessonId
                ? "The next lesson is now unlocked."
                : result.courseCompleted
                  ? "You've passed every required lesson in this course."
                  : "Nice work."
              : "The next lesson stays locked until you pass. Review the lesson, then try again. Every attempt is saved."}
          </p>
        </div>
      </div>

      <ol className="result-list">
        {(result.results ?? []).map((r, i) => {
          const q = byId.get(r.questionId);
          const chosen = q?.options.find((o) => o.id === r.selectedOptionId)?.label;
          const correct = r.correctOptionId ? q?.options.find((o) => o.id === r.correctOptionId)?.label : null;
          return (
            <li key={r.questionId} className={r.isCorrect ? "ok" : "no"}>
              <span className="mark" aria-hidden="true">{r.isCorrect ? "✓" : "✕"}</span>
              <div>
                <div className="rq">{i + 1}. {q?.prompt}</div>
                <div className="ra">
                  <span className="sr-only">{r.isCorrect ? "Correct. " : "Incorrect. "}</span>
                  Your answer: {chosen}
                  {!r.isCorrect && correct ? <> · Correct answer: {correct}</> : null}
                </div>
                {r.explanation && <div className="rx">{r.explanation}</div>}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="actions-row">
        {passed ? (
          result.nextLessonId ? (
            <Link className="btn btn-primary" href={lessonHref(result.nextLessonId, preview)}>Continue to next lesson<Icon name="arrow" /></Link>
          ) : !preview && result.nextCourse ? (
            <NextCourseActions nextCourse={result.nextCourse} courseId={view.courseId} />
          ) : (
            <Link className="btn btn-primary" href={preview ? `/admin/courses/${preview.courseId}` : `/courses/${view.courseId}`}>{preview ? "Back to course builder" : "Back to course"}<Icon name="arrow" /></Link>
          )
        ) : (
          <>
            <button type="button" className="btn btn-primary" onClick={onRetry}>Retry quiz<Icon name="redo" /></button>
            <a className="btn btn-ghost" href="#lesson-top">Review lesson</a>
          </>
        )}
      </div>
    </section>
  );
}

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/Icons";
import { submitQuiz, type QuizResult } from "@/lib/lesson-actions";
import { formatDuration } from "@/lib/format";
import type { LessonQuestion, LessonView } from "@/lib/lesson";
import { useWatchTracker } from "./useWatchTracker";

export function LessonClient({ view }: { view: LessonView }) {
  const { lesson } = view;
  const tracker = useWatchTracker({
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
          <span>{tracker.unlocked ? "Quiz unlocked" : `${watchedPct}% of ${needed}% needed`}</span>
        </div>
        <div className="bar watch-bar" role="progressbar" aria-valuenow={watchedPct} aria-valuemin={0} aria-valuemax={100} aria-label="Video watched">
          <i style={{ width: `${watchedPct}%` }} />
          <b style={{ left: `${needed}%` }} aria-hidden="true" />
        </div>
        {tracker.saveError && <p className="form-error" role="alert" style={{ marginTop: 8 }}>{tracker.saveError}</p>}
      </div>

      <Quiz view={view} unlocked={tracker.unlocked} />
    </div>
  );
}

type Tracker = ReturnType<typeof useWatchTracker>;

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

function Quiz({ view, unlocked }: { view: LessonView; unlocked: boolean }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [pending, start] = useTransition();
  const { questions, lesson } = view;
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
    return <QuizResults view={view} result={result} onRetry={() => { setResult(null); setAnswers({}); }} />;
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
          start(async () => setResult(await submitQuiz(lesson.id, answers)));
        }}
      >
        {questions.map((q, i) => (
          <QuestionField key={q.id} q={q} index={i} value={answers[q.id]} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
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

function QuizResults({ view, result, onRetry }: { view: LessonView; result: QuizResult; onRetry: () => void }) {
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
            <Link className="btn btn-primary" href={`/lessons/${result.nextLessonId}`}>Continue to next lesson<Icon name="arrow" /></Link>
          ) : (
            <Link className="btn btn-primary" href={`/courses/${view.courseId}`}>Back to course<Icon name="arrow" /></Link>
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

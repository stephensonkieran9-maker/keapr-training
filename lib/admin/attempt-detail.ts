// Per-person, per-course detail for admins: every quiz attempt with its
// score, time taken and the questions got wrong, plus watch and completion
// times per lesson. Pure computation from raw rows, so it's tested.

export interface DetailInput {
  lessons: {
    id: string;
    position: number;
    title: string;
    videoSeconds: number;
    isRequired: boolean;
    questions: { id: string; position: number; prompt: string; options: { id: string; label: string }[]; correctOptionId: string | null }[];
  }[];
  attempts: {
    id: string;
    lessonId: string;
    answers: Record<string, string>;
    correct: number;
    total: number;
    passRatio: number;
    passed: boolean;
    submittedAt: string;
    startedAt: string | null;
  }[];
  completions: { lessonId: string; source: "quiz_pass" | "admin_override" | "watched"; completedAt: string; overrideReason: string | null }[];
  video: { lessonId: string; watchedSeconds: number; createdAt: string | null; updatedAt: string }[];
  assignedAt: string;
  completedAt: string | null;
}

export interface WrongAnswer {
  position: number;
  prompt: string;
  chosen: string | null;
  correct: string | null;
}

export interface AttemptDetail {
  number: number;
  submittedAt: string;
  correct: number;
  total: number;
  percent: number;
  passMarkPercent: number;
  passed: boolean;
  durationSeconds: number | null;
  wrong: WrongAnswer[];
}

export interface LessonDetail {
  lessonId: string;
  position: number;
  title: string;
  hasQuiz: boolean;
  videoSeconds: number;
  watchedSeconds: number;
  startedAt: string | null;
  completedAt: string | null;
  completedBy: "quiz_pass" | "admin_override" | "watched" | null;
  overrideReason: string | null;
  /** From first opening the video to completing the lesson. */
  timeToCompleteSeconds: number | null;
  attempts: AttemptDetail[];
  bestPercent: number | null;
}

export interface CourseDetail {
  lessons: LessonDetail[];
  startedAt: string | null;
  completedAt: string | null;
  /** From first activity to course completion. */
  elapsedSeconds: number | null;
  totalWatchedSeconds: number;
  totalAttempts: number;
  passedFirstTime: number;
  quizLessons: number;
  /** Questions missed, across all attempts, most-missed first. */
  mostMissed: { lessonPosition: number; lessonTitle: string; position: number; prompt: string; misses: number }[];
}

const secondsBetween = (from: string | null, to: string | null) =>
  from && to ? Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 1000)) : null;

const earliest = (values: (string | null | undefined)[]) =>
  values.filter((v): v is string => Boolean(v)).sort()[0] ?? null;

export function buildCourseDetail(input: DetailInput): CourseDetail {
  const misses = new Map<string, { lessonPosition: number; lessonTitle: string; position: number; prompt: string; misses: number }>();

  const lessons = [...input.lessons]
    .sort((a, b) => a.position - b.position)
    .map((l): LessonDetail => {
      const attempts = input.attempts
        .filter((a) => a.lessonId === l.id)
        .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
        .map((a, i): AttemptDetail => {
          const wrong = [...l.questions]
            .sort((x, y) => x.position - y.position)
            .filter((q) => q.correctOptionId && a.answers[q.id] !== q.correctOptionId)
            .map((q) => ({
              position: q.position,
              prompt: q.prompt,
              chosen: q.options.find((o) => o.id === a.answers[q.id])?.label ?? null,
              correct: q.options.find((o) => o.id === q.correctOptionId)?.label ?? null,
            }));
          wrong.forEach((w) => {
            const k = `${l.id}:${w.position}`;
            const m = misses.get(k) ?? { lessonPosition: l.position, lessonTitle: l.title, position: w.position, prompt: w.prompt, misses: 0 };
            m.misses += 1;
            misses.set(k, m);
          });
          return {
            number: i + 1,
            submittedAt: a.submittedAt,
            correct: a.correct,
            total: a.total,
            percent: Math.floor((a.correct / Math.max(1, a.total)) * 100),
            passMarkPercent: Math.round(a.passRatio * 100),
            passed: a.passed,
            durationSeconds: secondsBetween(a.startedAt, a.submittedAt),
            wrong,
          };
        });
      const v = input.video.find((x) => x.lessonId === l.id);
      const done = input.completions.find((c) => c.lessonId === l.id);
      const startedAt = earliest([v?.createdAt, input.attempts.filter((a) => a.lessonId === l.id).map((a) => a.startedAt ?? a.submittedAt).sort()[0]]);
      return {
        lessonId: l.id,
        position: l.position,
        title: l.title,
        hasQuiz: l.questions.length > 0,
        videoSeconds: l.videoSeconds,
        watchedSeconds: Math.min(l.videoSeconds, v?.watchedSeconds ?? 0),
        startedAt,
        completedAt: done?.completedAt ?? null,
        completedBy: done?.source ?? null,
        overrideReason: done?.overrideReason ?? null,
        // Only when we know when they opened the video (recorded from migration 0013).
        timeToCompleteSeconds: v?.createdAt ? secondsBetween(v.createdAt, done?.completedAt ?? null) : null,
        attempts,
        bestPercent: attempts.length ? Math.max(...attempts.map((a) => a.percent)) : null,
      };
    });

  const startedAt = earliest(lessons.map((l) => l.startedAt));
  const quizLessons = lessons.filter((l) => l.hasQuiz);
  return {
    lessons,
    startedAt,
    completedAt: input.completedAt,
    elapsedSeconds: secondsBetween(startedAt, input.completedAt),
    totalWatchedSeconds: lessons.reduce((n, l) => n + l.watchedSeconds, 0),
    totalAttempts: input.attempts.length,
    passedFirstTime: quizLessons.filter((l) => l.attempts[0]?.passed).length,
    quizLessons: quizLessons.length,
    mostMissed: [...misses.values()].sort((a, b) => b.misses - a.misses || a.lessonPosition - b.lessonPosition || a.position - b.position),
  };
}

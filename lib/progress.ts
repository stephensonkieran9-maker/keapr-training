// Pure progression rules, shared by the dashboard and (later) the lesson
// and quiz pages. No database or framework code here, so it's easy to test.
import type { CourseStatus, CourseSummary, LessonStep, NextLesson } from "./types.ts";

export interface LessonRow {
  id: string;
  position: number;
  title: string;
  videoSeconds: number;
  requiredWatchRatio: number;
  passRatio: number;
  isRequired: boolean;
  estimatedMinutes: number | null;
  objectives: string[];
  /** false = watch-only lesson (no quiz). Missing means it has a quiz. */
  hasQuiz?: boolean;
}

export interface EnrolmentRow {
  enrolmentId: string;
  courseId: string;
  title: string;
  description: string;
  isDemo: boolean;
  versionId?: string;
  version?: number;
  completedAt: string | null;
  assignedAt: string;
  lessons: LessonRow[];
}

export interface AttemptRow {
  enrolmentId: string;
  lessonId: string;
  correctCount: number;
  questionCount: number;
}

export interface ProgressInput {
  enrolments: EnrolmentRow[];
  completedLessonKeys: Set<string>; // `${enrolmentId}:${lessonId}` with a live completion
  attempts: AttemptRow[];
  watchedSeconds: Map<string, number>; // `${enrolmentId}:${lessonId}` → unique seconds watched
}

export const key = (enrolmentId: string, lessonId: string) => `${enrolmentId}:${lessonId}`;

/** A quiz passes on the exact ratio, never a rounded percentage. */
export function isPass(correct: number, total: number, passRatio: number): boolean {
  if (total <= 0) return false;
  // Compare as integers to avoid floating-point surprises: correct/total >= ratio
  // ⇔ correct * 1000 >= ratio * 1000 * total (ratios are stored to 3 d.p.).
  return correct * 1000 >= Math.round(passRatio * 1000) * total;
}

/** Lesson states for one enrolment: passed, then the first unpassed is available, the rest locked. */
export function lessonSteps(e: EnrolmentRow, input: ProgressInput): LessonStep[] {
  const ordered = [...e.lessons].sort((a, b) => a.position - b.position);
  let foundAvailable = false;
  let previousTitle = "";

  return ordered.map((lesson, i) => {
    const k = key(e.enrolmentId, lesson.id);
    const attempts = input.attempts.filter((a) => a.enrolmentId === e.enrolmentId && a.lessonId === lesson.id);
    const best = attempts.length
      ? Math.max(...attempts.map((a) => Math.floor((a.correctCount / a.questionCount) * 100)))
      : undefined;
    const prevPosition = i > 0 ? ordered[i - 1].position : null;
    const prevWatchOnly = i > 0 && ordered[i - 1].hasQuiz === false;
    const prev = previousTitle;
    previousTitle = lesson.title;

    if (input.completedLessonKeys.has(k)) {
      return { lessonId: lesson.id, position: lesson.position, title: lesson.title, state: "passed", bestScorePercent: best };
    }
    // Optional lessons never block the ones after them.
    if (!foundAvailable) {
      if (lesson.isRequired) foundAvailable = true;
      return {
        lessonId: lesson.id,
        position: lesson.position,
        title: lesson.title,
        state: "available",
        bestScorePercent: best,
        estimatedMinutes: lesson.estimatedMinutes ?? undefined,
      };
    }
    return {
      lessonId: lesson.id,
      position: lesson.position,
      title: lesson.title,
      state: "locked",
      lockedReason:
        prevPosition === null
          ? `Pass "${prev}" to unlock`
          : prevWatchOnly
            ? `Finish watching lesson ${prevPosition} to unlock`
            : `Pass the lesson ${prevPosition} quiz to unlock`,
    };
  });
}

export function courseStatus(e: EnrolmentRow, steps: LessonStep[], input: ProgressInput): CourseStatus {
  const required = e.lessons.filter((l) => l.isRequired);
  const allPassed = required.length > 0 && required.every((l) => input.completedLessonKeys.has(key(e.enrolmentId, l.id)));
  if (e.completedAt || allPassed) return "completed";
  const anyActivity =
    steps.some((s) => s.state === "passed") ||
    e.lessons.some((l) => (input.watchedSeconds.get(key(e.enrolmentId, l.id)) ?? 0) > 0) ||
    input.attempts.some((a) => a.enrolmentId === e.enrolmentId);
  return anyActivity ? "in_progress" : "not_started";
}

export interface ComputedProgress {
  courses: CourseSummary[];
  stepsByEnrolment: Map<string, LessonStep[]>;
  nextLesson: NextLesson | null;
  passMarkPercent: number;
}

export function computeProgress(input: ProgressInput): ComputedProgress {
  const stepsByEnrolment = new Map<string, LessonStep[]>();
  const courses: CourseSummary[] = input.enrolments.map((e) => {
    const steps = lessonSteps(e, input);
    stepsByEnrolment.set(e.enrolmentId, steps);
    const status = courseStatus(e, steps, input);
    const minutes = e.lessons.reduce((n, l) => n + (l.estimatedMinutes ?? Math.ceil(l.videoSeconds / 60)), 0);
    return {
      enrolmentId: e.enrolmentId,
      courseId: e.courseId,
      title: e.title,
      description: e.description,
      status,
      lessonCount: e.lessons.length,
      lessonsPassed: steps.filter((s) => s.state === "passed").length,
      durationMinutes: minutes,
      completedOn: status === "completed" && e.completedAt ? e.completedAt.slice(0, 10) : undefined,
    };
  });

  // Next lesson: prefer a course already in progress, then the oldest assignment.
  const rank: Record<CourseStatus, number> = { in_progress: 0, not_started: 1, completed: 2 };
  const candidates = input.enrolments
    .map((e, i) => ({ e, c: courses[i] }))
    .filter(({ c }) => c.status !== "completed")
    .sort((a, b) => rank[a.c.status] - rank[b.c.status] || a.e.assignedAt.localeCompare(b.e.assignedAt));

  let nextLesson: NextLesson | null = null;
  let passMarkPercent = 80;
  for (const { e, c } of candidates) {
    const step = stepsByEnrolment.get(e.enrolmentId)?.find((s) => s.state === "available");
    const lesson = step && e.lessons.find((l) => l.id === step.lessonId);
    if (!step || !lesson) continue;
    passMarkPercent = Math.round(lesson.passRatio * 100);
    nextLesson = {
      enrolmentId: e.enrolmentId,
      lessonId: lesson.id,
      courseTitle: e.title,
      lessonTitle: lesson.title,
      description: lesson.objectives[0] ?? "",
      position: lesson.position,
      lessonCount: c.lessonCount,
      lessonsPassed: c.lessonsPassed,
      videoSeconds: lesson.videoSeconds,
      watchedSeconds: Math.min(lesson.videoSeconds, input.watchedSeconds.get(key(e.enrolmentId, lesson.id)) ?? 0),
      requiredWatchPercent: Math.round(lesson.requiredWatchRatio * 100),
      hasQuiz: lesson.hasQuiz !== false,
    };
    break;
  }

  return { courses, stepsByEnrolment, nextLesson, passMarkPercent };
}

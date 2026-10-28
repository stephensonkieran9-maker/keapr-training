import "server-only";
import { loadLearnerProgress } from "./learner-progress";
import { requireProfile } from "./auth";
import type { QuizResultSummary } from "./types";

/** The signed-in learner's quiz results for the My results page. */
export async function getMyQuizResults(): Promise<QuizResultSummary[]> {
  const { profile, supabase } = await requireProfile();
  const { enrolments } = await loadLearnerProgress(supabase, profile.id);
  return loadQuizResults(supabase, enrolments);
}

/** One row per quiz they've taken: best and latest score, newest first. Read
 * through their own session, so row-level security limits it to their attempts. */
async function loadQuizResults(
  supabase: Awaited<ReturnType<typeof requireProfile>>["supabase"],
  enrolments: Awaited<ReturnType<typeof loadLearnerProgress>>["enrolments"],
): Promise<QuizResultSummary[]> {
  const ids = enrolments.map((e) => e.enrolmentId);
  if (!ids.length) return [];
  const { data } = await supabase
    .from("quiz_attempts")
    .select("enrolment_id, lesson_id, correct_count, question_count, passed, submitted_at")
    .in("enrolment_id", ids)
    .order("submitted_at", { ascending: true });
  const byLesson = new Map<string, QuizResultSummary>();
  for (const a of data ?? []) {
    const e = enrolments.find((x) => x.enrolmentId === a.enrolment_id);
    const lesson = e?.lessons.find((l) => l.id === a.lesson_id);
    if (!e || !lesson) continue;
    const pct = Math.floor((a.correct_count / Math.max(1, a.question_count)) * 100);
    const row = byLesson.get(a.lesson_id) ?? {
      lessonId: a.lesson_id, lessonTitle: lesson.title, courseTitle: e.title, attempts: 0,
      bestPercent: 0, lastPercent: 0, lastAt: a.submitted_at, passed: false, passPercent: Math.round(lesson.passRatio * 100),
    };
    row.attempts += 1;
    row.bestPercent = Math.max(row.bestPercent, pct);
    row.lastPercent = pct;
    row.lastAt = a.submitted_at;
    row.passed = row.passed || Boolean(a.passed);
    byLesson.set(a.lesson_id, row);
  }
  return [...byLesson.values()].sort((x, y) => y.lastAt.localeCompare(x.lastAt));
}

import "server-only";
import { demoDashboard } from "./demo-data";
import { loadLearnerProgress } from "./learner-progress";
import { timed } from "./timing";
import { isSupabaseConfigured } from "./supabase/config";
import { learnerFromProfile, requireProfile } from "./auth";
import type { DashboardData, QuizResultSummary } from "./types";

export { formatDuration, formatShortDate, percent } from "./format";

// Demo content: used on /demo, and everywhere when Supabase isn't configured.
export async function getDemoDashboard(): Promise<DashboardData> {
  return demoDashboard;
}

// The signed-in learner's real dashboard. Reads go through the user's own
// session, so row-level security limits them to this learner's records.
export async function getDashboardData(): Promise<DashboardData> {
  if (!isSupabaseConfigured()) return demoDashboard;

  const { profile, supabase } = await requireProfile();
  const learner = learnerFromProfile(profile);

  const { enrolments, computed, resources } = await timed("dashboard data", () => loadLearnerProgress(supabase, profile.id));

  const currentEnrolment = computed.nextLesson?.enrolmentId;

  return {
    isDemo: enrolments.some((e) => e.isDemo),
    termLabel: termLabel(new Date()),
    learner,
    nextLesson: computed.nextLesson,
    currentCourseSteps: currentEnrolment ? computed.stepsByEnrolment.get(currentEnrolment) ?? [] : [],
    passMarkPercent: computed.passMarkPercent,
    courses: computed.courses,
    resources,
    quizResults: await loadQuizResults(supabase, enrolments),
  };
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

function termLabel(d: Date): string {
  const m = d.getMonth();
  const season = m < 2 || m === 11 ? "Winter" : m < 5 ? "Spring" : m < 8 ? "Summer" : "Autumn";
  return `${season} ${d.getFullYear()}`;
}

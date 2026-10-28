import "server-only";
import { demoDashboard } from "./demo-data";
import { loadLearnerProgress } from "./learner-progress";
import { timed } from "./timing";
import { isSupabaseConfigured } from "./supabase/config";
import { learnerFromProfile, requireProfile } from "./auth";
import type { DashboardData } from "./types";

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
  };
}

function termLabel(d: Date): string {
  const m = d.getMonth();
  const season = m < 2 || m === 11 ? "Winter" : m < 5 ? "Spring" : m < 8 ? "Summer" : "Autumn";
  return `${season} ${d.getFullYear()}`;
}

import "server-only";
import { createAdminClient } from "./supabase/admin";
import { loadLearnerProgress } from "./learner-progress";
import { nextCourseAfter, type NextCourse } from "./progress.ts";

/** Called just after someone finishes a course. Never throws. */
export async function findNextCourse(learnerId: string, finishedCourseId: string): Promise<NextCourse | null> {
  try {
    const { computed } = await loadLearnerProgress(createAdminClient(), learnerId);
    return nextCourseAfter(computed, finishedCourseId);
  } catch {
    return null;
  }
}

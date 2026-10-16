import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ReportInput } from "./report.ts";

const PAGE = 1000; // Supabase returns at most 1,000 rows per request

/** Fetches every row of a query, a page at a time. */
async function all<T>(label: string, page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) {
      console.error(`[admin] ${label}: ${error.message}`);
      throw new Error(`Couldn't load ${label}.`);
    }
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) return out;
  }
}

// Callers must run requireAdmin() first.
export async function loadReportInput(): Promise<ReportInput> {
  const admin = createAdminClient();
  type Version = { id: string; course_id: string; title: string; version: number; lessons: { id: string; title: string; position: number; is_required: boolean }[] | null };

  const [people, versions, enrolments, completions, attempts, video, pathRows, pathCourses, pathMembers] = await Promise.all([
    all("staff", (a, b) => admin.from("profiles").select("id, full_name, email, is_active").order("id").range(a, b)),
    all("courses", (a, b) => admin.from("course_versions").select("id, course_id, title, version, lessons(id, title, position, is_required)").order("id").range(a, b)),
    all("assignments", (a, b) =>
      admin.from("enrolments").select("id, learner_id, course_version_id, assigned_at, completed_at").is("unassigned_at", null).order("id").range(a, b),
    ),
    all("completions", (a, b) => admin.from("lesson_completions").select("enrolment_id, lesson_id, completed_at").is("revoked_at", null).order("id").range(a, b)),
    all("quiz attempts", (a, b) =>
      admin.from("quiz_attempts").select("enrolment_id, lesson_id, correct_count, question_count, pass_ratio_used, passed, submitted_at").order("id").range(a, b),
    ),
    all("video progress", (a, b) => admin.from("video_progress").select("enrolment_id, lesson_id, updated_at").order("enrolment_id").order("lesson_id").range(a, b)),
    // Training paths (migration 0011); empty if not there yet.
    admin.from("training_paths").select("id, name").order("name"),
    admin.from("training_path_courses").select("path_id, course_id"),
    admin.from("path_assignments").select("path_id, learner_id").is("unassigned_at", null),
  ]);

  return {
    people: people.map((p) => ({ id: p.id, name: p.full_name, email: p.email, isActive: p.is_active })),
    courses: (versions as unknown as Version[]).map((v) => ({
      versionId: v.id,
      courseId: v.course_id,
      title: v.title,
      version: v.version,
      lessons: (v.lessons ?? []).map((l) => ({ id: l.id, title: l.title, position: l.position, isRequired: l.is_required })),
    })),
    enrolments: enrolments.map((e) => ({ id: e.id, learnerId: e.learner_id, versionId: e.course_version_id, assignedAt: e.assigned_at, completedAt: e.completed_at })),
    completions: completions.map((c) => ({ enrolmentId: c.enrolment_id, lessonId: c.lesson_id, completedAt: c.completed_at })),
    attempts: attempts.map((a) => ({
      enrolmentId: a.enrolment_id,
      lessonId: a.lesson_id,
      correct: a.correct_count,
      total: a.question_count,
      passRatio: Number(a.pass_ratio_used),
      passed: a.passed,
      submittedAt: a.submitted_at,
    })),
    videoActivity: video.map((v) => ({ enrolmentId: v.enrolment_id, updatedAt: v.updated_at })),
    paths: pathRows.error
      ? []
      : (pathRows.data ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          courseIds: (pathCourses.data ?? []).filter((c) => c.path_id === p.id).map((c) => c.course_id),
          memberIds: (pathMembers.data ?? []).filter((m) => m.path_id === p.id).map((m) => m.learner_id),
        })),
  };
}

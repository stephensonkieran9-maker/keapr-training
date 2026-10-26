import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildCourseDetail, type CourseDetail } from "./attempt-detail.ts";

export interface EnrolmentDetail extends CourseDetail {
  enrolmentId: string;
  learnerId: string;
  learnerName: string;
  courseId: string;
  courseTitle: string;
  version: number;
  assignedAt: string;
  unassignedAt: string | null;
}

// Callers must run requireAdmin() first.
export async function getEnrolmentDetail(enrolmentId: string): Promise<EnrolmentDetail | null> {
  const admin = createAdminClient();
  const { data: e } = await admin
    .from("enrolments")
    .select("id, learner_id, course_version_id, assigned_at, completed_at, unassigned_at, profiles!enrolments_learner_id_fkey(full_name), course_versions(course_id, title, version)")
    .eq("id", enrolmentId)
    .maybeSingle();
  if (!e) return null;

  type Opt = { id: string; label: string; position: number };
  type Q = { id: string; position: number; prompt: string; quiz_options: Opt[] | null; quiz_answer_keys: { correct_option_id: string } | { correct_option_id: string }[] | null };
  type L = { id: string; position: number; title: string; video_seconds: number; is_required: boolean; quiz_questions: Q[] | null };

  // Timing columns arrive with migration 0013; fall back without them.
  const attemptsQuery = (cols: string) => admin.from("quiz_attempts").select(cols).eq("enrolment_id", enrolmentId).order("submitted_at");
  const videoQuery = (cols: string) => admin.from("video_progress").select(cols).eq("enrolment_id", enrolmentId);

  const [lessonsRes, completionsRes] = await Promise.all([
    admin
      .from("lessons")
      .select("id, position, title, video_seconds, is_required, quiz_questions(id, position, prompt, quiz_options(id, label, position), quiz_answer_keys(correct_option_id))")
      .eq("course_version_id", e.course_version_id)
      .order("position"),
    admin.from("lesson_completions").select("lesson_id, source, completed_at, override_reason").eq("enrolment_id", enrolmentId).is("revoked_at", null),
  ]);
  let attemptsRes = await attemptsQuery("id, lesson_id, submitted_answers, correct_count, question_count, pass_ratio_used, passed, submitted_at, started_at");
  if (attemptsRes.error) attemptsRes = await attemptsQuery("id, lesson_id, submitted_answers, correct_count, question_count, pass_ratio_used, passed, submitted_at");
  let videoRes = await videoQuery("lesson_id, watched_seconds, created_at, updated_at");
  if (videoRes.error) videoRes = await videoQuery("lesson_id, watched_seconds, updated_at");

  type A = { id: string; lesson_id: string; submitted_answers: Record<string, string>; correct_count: number; question_count: number; pass_ratio_used: number | string; passed: boolean; submitted_at: string; started_at?: string | null };
  type V = { lesson_id: string; watched_seconds: number | string; created_at?: string | null; updated_at: string };

  const detail = buildCourseDetail({
    assignedAt: e.assigned_at,
    completedAt: e.completed_at,
    lessons: ((lessonsRes.data ?? []) as unknown as L[]).map((l) => ({
      id: l.id,
      position: l.position,
      title: l.title,
      videoSeconds: l.video_seconds,
      isRequired: l.is_required,
      questions: (l.quiz_questions ?? []).map((q) => {
        const key = Array.isArray(q.quiz_answer_keys) ? q.quiz_answer_keys[0] : q.quiz_answer_keys;
        return {
          id: q.id,
          position: q.position,
          prompt: q.prompt,
          options: [...(q.quiz_options ?? [])].sort((a, b) => a.position - b.position).map((o) => ({ id: o.id, label: o.label })),
          correctOptionId: key?.correct_option_id ?? null,
        };
      }),
    })),
    attempts: ((attemptsRes.data ?? []) as unknown as A[]).map((a) => ({
      id: a.id,
      lessonId: a.lesson_id,
      answers: a.submitted_answers ?? {},
      correct: a.correct_count,
      total: a.question_count,
      passRatio: Number(a.pass_ratio_used),
      passed: a.passed,
      submittedAt: a.submitted_at,
      startedAt: a.started_at ?? null,
    })),
    completions: (completionsRes.data ?? []).map((c) => ({ lessonId: c.lesson_id, source: c.source, completedAt: c.completed_at, overrideReason: c.override_reason })),
    video: ((videoRes.data ?? []) as unknown as V[]).map((v) => ({ lessonId: v.lesson_id, watchedSeconds: Number(v.watched_seconds), createdAt: v.created_at ?? null, updatedAt: v.updated_at })),
  });

  const prof = e.profiles as unknown as { full_name: string } | { full_name: string }[] | null;
  const cv = e.course_versions as unknown as { course_id: string; title: string; version: number } | { course_id: string; title: string; version: number }[] | null;
  const p = Array.isArray(prof) ? prof[0] : prof;
  const v = Array.isArray(cv) ? cv[0] : cv;
  return {
    ...detail,
    enrolmentId: e.id,
    learnerId: e.learner_id,
    learnerName: p?.full_name ?? "Unknown",
    courseId: v?.course_id ?? "",
    courseTitle: v?.title ?? "Course",
    version: v?.version ?? 1,
    assignedAt: e.assigned_at,
    unassignedAt: e.unassigned_at,
  };
}

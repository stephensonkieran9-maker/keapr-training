import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { computeProgress, key, type ComputedProgress, type EnrolmentRow } from "./progress.ts";
import type { Resource } from "./types";

export interface LearnerProgress {
  enrolments: EnrolmentRow[];
  computed: ComputedProgress;
  resources: Resource[];
}

// Loads one learner's enrolments and progress. Pass the learner's own client
// (row-level security applies) or, for admin screens, the service client
// after checking the caller is an admin.
export async function loadLearnerProgress(supabase: SupabaseClient, learnerId: string): Promise<LearnerProgress> {
  const { data: enrolmentRows, error } = await supabase
    .from("enrolments")
    .select(
      `id, assigned_at, completed_at,
       course_versions ( id, course_id, version, title, description, is_demo,
         lessons ( id, position, title, objectives, video_seconds, required_watch_ratio, pass_ratio, is_required, estimated_minutes, quiz_questions ( count ) ) )`,
    )
    .eq("learner_id", learnerId)
    .is("unassigned_at", null)
    .order("assigned_at", { ascending: true });

  if (error) throw new Error(`Couldn't load your training: ${error.message}`);

  type LessonDb = {
    id: string; position: number; title: string; objectives: string[] | null; video_seconds: number;
    required_watch_ratio: number | string; pass_ratio: number | string; is_required: boolean; estimated_minutes: number | null;
    quiz_questions?: { count: number }[] | null;
  };
  type VersionDb = { id: string; course_id: string; version: number; title: string; description: string; is_demo: boolean; lessons: LessonDb[] | null };
  type EnrolmentDb = { id: string; assigned_at: string; completed_at: string | null; course_versions: VersionDb | VersionDb[] | null };

  const enrolments: EnrolmentRow[] = ((enrolmentRows ?? []) as unknown as EnrolmentDb[])
    .map((row): EnrolmentRow | null => {
      const v = Array.isArray(row.course_versions) ? row.course_versions[0] : row.course_versions;
      if (!v) return null;
      return {
        enrolmentId: row.id,
        courseId: v.course_id,
        title: v.title,
        description: v.description,
        isDemo: v.is_demo,
        versionId: v.id,
        version: v.version,
        completedAt: row.completed_at,
        assignedAt: row.assigned_at,
        lessons: (v.lessons ?? []).map((l) => ({
          id: l.id,
          position: l.position,
          title: l.title,
          videoSeconds: l.video_seconds,
          requiredWatchRatio: Number(l.required_watch_ratio),
          passRatio: Number(l.pass_ratio),
          isRequired: l.is_required,
          estimatedMinutes: l.estimated_minutes,
          objectives: l.objectives ?? [],
          // If the count can't be read, assume a quiz (the safer default).
          hasQuiz: Array.isArray(l.quiz_questions) && l.quiz_questions.length ? Number(l.quiz_questions[0].count) > 0 : true,
        })),
      };
    })
    .filter((e): e is EnrolmentRow => e !== null);

  // Training path (migration 0010): which courses are locked, and their order.
  // Path courses come first, in path order; the rest keep assignment order.
  const { data: locks, error: lockError } = await supabase.rpc("course_locks", { p_learner: learnerId });
  if (!lockError && Array.isArray(locks)) {
    const byVersion = new Map((locks as { course_version_id: string; path_position: number | null; locked_by: string | null }[]).map((l) => [l.course_version_id, l]));
    enrolments.forEach((e) => {
      const l = e.versionId ? byVersion.get(e.versionId) : undefined;
      if (l?.locked_by) e.lockedBy = l.locked_by;
    });
    const pos = (e: EnrolmentRow) => (e.versionId ? byVersion.get(e.versionId)?.path_position : null) ?? Number.POSITIVE_INFINITY;
    enrolments.sort((a, b) => pos(a) - pos(b));
  }

  const enrolmentIds = enrolments.map((e) => e.enrolmentId);
  const lessonIds = enrolments.flatMap((e) => e.lessons.map((l) => l.id));

  const [completions, attempts, progress, resources] = enrolmentIds.length
    ? await Promise.all([
        supabase.from("lesson_completions").select("enrolment_id, lesson_id").in("enrolment_id", enrolmentIds).is("revoked_at", null),
        supabase.from("quiz_attempts").select("enrolment_id, lesson_id, correct_count, question_count").in("enrolment_id", enrolmentIds),
        supabase.from("video_progress").select("enrolment_id, lesson_id, watched_seconds").in("enrolment_id", enrolmentIds),
        lessonIds.length
          ? supabase.from("lesson_resources").select("id, title, kind, size_bytes, lesson_id").in("lesson_id", lessonIds)
          : Promise.resolve({ data: [], error: null }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const computed = computeProgress({
    enrolments,
    completedLessonKeys: new Set((completions.data ?? []).map((c) => key(c.enrolment_id, c.lesson_id))),
    attempts: (attempts.data ?? []).map((a) => ({
      enrolmentId: a.enrolment_id,
      lessonId: a.lesson_id,
      correctCount: a.correct_count,
      questionCount: a.question_count,
    })),
    watchedSeconds: new Map((progress.data ?? []).map((p) => [key(p.enrolment_id, p.lesson_id), Number(p.watched_seconds)])),
  });

  return {
    enrolments,
    computed,
    resources: (resources.data ?? []).map(
      (r): Resource => ({
        id: r.id,
        title: r.title,
        kind: r.kind === "pdf" || r.kind === "doc" || r.kind === "checklist" ? r.kind : "doc",
        sizeLabel: r.size_bytes ? `${r.kind.toUpperCase()} · ${(r.size_bytes / 1_048_576).toFixed(1)} MB` : undefined,
        href: `/lessons/${r.lesson_id}`, // the lesson page makes the signed download link
      }),
    ),
  };
}

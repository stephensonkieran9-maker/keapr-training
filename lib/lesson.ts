import "server-only";
import { requireProfile } from "./auth";
import { createAdminClient } from "./supabase/admin";
import { lessonSteps, key, type EnrolmentRow } from "./progress.ts";
import { meetsWatchRequirement, type Range } from "./video-ranges.ts";
import type { LessonStep } from "./types";
import { signDownloads, type SignedDownload } from "./downloads";

export interface LessonQuestion {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
}

export interface LessonView {
  enrolmentId: string;
  /** Published course version (for the checklist). Empty in admin preview. */
  courseVersionId: string;
  courseId: string;
  courseTitle: string;
  isDemo: boolean;
  lesson: {
    id: string;
    position: number;
    title: string;
    objectives: string[];
    notes: string | null;
    videoSeconds: number;
    requiredWatchPercent: number;
    passPercent: number;
    /** false = watch-only: completes once the video is watched. */
    hasQuiz: boolean;
    /** "reading" = no video: read the text, confirm, then the quiz. */
    kind: "video" | "reading";
    readingBody: string | null;
    /** Has its own checklist items (shown under the lesson). */
    hasChecklist?: boolean;
    /** Reading lessons: a task done outside the app ("I've done this"). */
    isTask?: boolean;
  };
  video: { kind: "file"; src: string } | { kind: "placeholder" };
  state: LessonStep["state"];
  lockedReason?: string;
  steps: LessonStep[];
  lessonCount: number;
  progress: { positionSeconds: number; ranges: Range[]; watchedSeconds: number; quizUnlocked: boolean };
  questions: LessonQuestion[];
  attempts: { count: number; bestPercent: number | null };
  nextLessonId: string | null;
  /** Download links are only created for unlocked lessons. */
  resources: SignedDownload[];
}

const SIGNED_URL_SECONDS = 4 * 60 * 60;

/** Everything the lesson page needs, read through the learner's own session
 * (row-level security limits it to courses they're enrolled on). Returns
 * null if the lesson doesn't exist or isn't assigned to them. */
export async function getLessonView(lessonId: string): Promise<LessonView | null> {
  const { profile, supabase } = await requireProfile();

  const baseColumns = "id, course_version_id, position, title, objectives, notes, video_ref, video_seconds, required_watch_ratio, pass_ratio";
  let lessonRes = await supabase.from("lessons").select(`${baseColumns}, kind, reading_body, is_task`).eq("id", lessonId).maybeSingle();
  // Older databases (before migrations 0014/0016) don't have these columns.
  if (lessonRes.error) lessonRes = await supabase.from("lessons").select(`${baseColumns}, kind, reading_body`).eq("id", lessonId).maybeSingle();
  if (lessonRes.error) lessonRes = await supabase.from("lessons").select(baseColumns).eq("id", lessonId).maybeSingle();
  const lessonRow = lessonRes.data as
    | ({ id: string; course_version_id: string; position: number; title: string; objectives: string[] | null; notes: string | null;
        video_ref: string | null; video_seconds: number; required_watch_ratio: number | string; pass_ratio: number | string;
        kind?: string; reading_body?: string | null; is_task?: boolean })
    | null;
  if (!lessonRow) return null;
  const isReading = lessonRow.kind === "reading";

  const [{ data: version }, { data: allLessons }, { data: enrolment }] = await Promise.all([
    supabase.from("course_versions").select("id, course_id, title, is_demo").eq("id", lessonRow.course_version_id).maybeSingle(),
    supabase
      .from("lessons")
      .select("id, position, title, video_seconds, required_watch_ratio, pass_ratio, is_required, estimated_minutes, objectives")
      .eq("course_version_id", lessonRow.course_version_id)
      .order("position"),
    supabase
      .from("enrolments")
      .select("id, assigned_at, completed_at")
      .eq("learner_id", profile.id)
      .eq("course_version_id", lessonRow.course_version_id)
      .is("unassigned_at", null)
      .maybeSingle(),
  ]);
  if (!version || !enrolment || !allLessons) return null;

  const [{ data: completions }, { data: progressRows }, { data: attempts }, { data: questions }, { data: resources }, { data: locks }] = await Promise.all([
    supabase.from("lesson_completions").select("lesson_id").eq("enrolment_id", enrolment.id).is("revoked_at", null),
    supabase.from("video_progress").select("lesson_id, position_seconds, watched_ranges, watched_seconds, quiz_unlocked_at").eq("enrolment_id", enrolment.id),
    supabase.from("quiz_attempts").select("lesson_id, correct_count, question_count").eq("enrolment_id", enrolment.id),
    supabase.from("quiz_questions").select("id, position, prompt, quiz_options(id, position, label)").eq("lesson_id", lessonId).order("position"),
    supabase.from("lesson_resources").select("id, title, kind, storage_path, size_bytes").eq("lesson_id", lessonId),
    supabase.rpc("course_locks", { p_learner: profile.id }), // errors (before migration 0010) just mean no locks
  ]);
  const lockedBy = Array.isArray(locks)
    ? ((locks as { course_version_id: string; locked_by: string | null }[]).find((l) => l.course_version_id === version.id)?.locked_by ?? undefined)
    : undefined;

  const row: EnrolmentRow = {
    enrolmentId: enrolment.id,
    courseId: version.course_id,
    title: version.title,
    description: "",
    isDemo: version.is_demo,
    completedAt: enrolment.completed_at,
    assignedAt: enrolment.assigned_at,
    lockedBy,
    lessons: allLessons.map((l) => ({
      id: l.id,
      position: l.position,
      title: l.title,
      videoSeconds: l.video_seconds,
      requiredWatchRatio: Number(l.required_watch_ratio),
      passRatio: Number(l.pass_ratio),
      isRequired: l.is_required,
      estimatedMinutes: l.estimated_minutes,
      objectives: l.objectives ?? [],
    })),
  };
  const allAttempts = (attempts ?? []).map((a) => ({ enrolmentId: enrolment.id, lessonId: a.lesson_id, correctCount: a.correct_count, questionCount: a.question_count }));
  const steps = lessonSteps(row, {
    enrolments: [row],
    completedLessonKeys: new Set((completions ?? []).map((c) => key(enrolment.id, c.lesson_id))),
    attempts: allAttempts,
    watchedSeconds: new Map((progressRows ?? []).map((p) => [key(enrolment.id, p.lesson_id), Number(p.watched_seconds)])),
  });
  const step = steps.find((s) => s.lessonId === lessonId)!;
  const hasQuiz = (questions ?? []).length > 0;

  const mine = (progressRows ?? []).find((p) => p.lesson_id === lessonId);

  // Watch-only lesson already watched but not yet recorded (e.g. watched
  // before migration 0009 was run): record it now.
  if (!hasQuiz && mine?.quiz_unlocked_at && step.state === "available") {
    const { error } = await createAdminClient().rpc("complete_watched_lesson", { p_learner: profile.id, p_lesson: lessonId });
    if (!error) {
      step.state = "passed";
      delete step.lockedReason;
    }
  }
  const watched = Number(mine?.watched_seconds ?? 0);
  const requiredRatio = Number(lessonRow.required_watch_ratio);
  const lessonAttempts = allAttempts.filter((a) => a.lessonId === lessonId);

  const position = allLessons.findIndex((l) => l.id === lessonId);
  const next = allLessons[position + 1];

  return {
    enrolmentId: enrolment.id,
    courseVersionId: version.id,
    courseId: version.course_id,
    courseTitle: version.title,
    isDemo: version.is_demo,
    lesson: {
      id: lessonRow.id,
      position: lessonRow.position,
      title: lessonRow.title,
      objectives: (lessonRow.objectives ?? []).filter(Boolean),
      notes: lessonRow.notes,
      videoSeconds: lessonRow.video_seconds,
      requiredWatchPercent: Math.round(requiredRatio * 100),
      passPercent: Math.round(Number(lessonRow.pass_ratio) * 100),
      hasQuiz,
      kind: isReading ? "reading" : "video",
      readingBody: isReading ? (lessonRow.reading_body ?? "") : null,
      isTask: isReading && lessonRow.is_task === true,
    },
    video: isReading ? { kind: "placeholder" } : await resolveVideo(lessonRow.video_ref),
    state: step.state,
    lockedReason: step.lockedReason,
    steps,
    lessonCount: allLessons.length,
    progress: {
      positionSeconds: Number(mine?.position_seconds ?? 0),
      ranges: (mine?.watched_ranges as Range[] | null) ?? [],
      watchedSeconds: watched,
      quizUnlocked: Boolean(mine?.quiz_unlocked_at) || (!isReading && meetsWatchRequirement(watched, lessonRow.video_seconds, requiredRatio)),
    },
    // Questions and options only: correct answers never reach the browser.
    // Options are shuffled on every load so the right answer isn't always in
    // the same place (scoring uses option ids, so order doesn't matter).
    questions: (questions ?? []).map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: shuffle(((q.quiz_options ?? []) as { id: string; position: number; label: string }[]).map((o) => ({ id: o.id, label: o.label }))),
    })),
    attempts: {
      count: lessonAttempts.length,
      bestPercent: lessonAttempts.length ? Math.max(...lessonAttempts.map((a) => Math.floor((a.correctCount / a.questionCount) * 100))) : null,
    },
    nextLessonId: next?.id ?? null,
    resources:
      step.state === "locked"
        ? (resources ?? []).map((r) => ({ id: r.id, title: r.title, kind: r.kind, href: null }))
        : await signDownloads((resources ?? []).map((r) => ({ id: r.id, title: r.title, kind: r.kind, path: r.storage_path, sizeBytes: r.size_bytes }))),
  };
}

export async function resolveVideo(ref: string | null): Promise<LessonView["video"]> {
  const value = (ref ?? "").trim();
  if (value.startsWith("storage:")) {
    const path = value.slice("storage:".length).replace(/^lesson-videos\//, "");
    const admin = createAdminClient();
    const { data } = await admin.storage.from("lesson-videos").createSignedUrl(path, SIGNED_URL_SECONDS);
    if (data?.signedUrl) return { kind: "file", src: data.signedUrl };
    return { kind: "placeholder" };
  }
  if (/^https:\/\/.+\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(value)) return { kind: "file", src: value };
  return { kind: "placeholder" };
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "./auth";
import { createAdminClient } from "./supabase/admin";
import { notifyAdmins } from "./notifications";
import { findNextCourse } from "./next-course";
import type { NextCourse } from "./progress.ts";

/** Course id for a lesson (for the Next course button). */
async function courseIdOfLesson(lessonId: string): Promise<string | null> {
  const { data } = await createAdminClient().from("lessons").select("course_versions(course_id)").eq("id", lessonId).maybeSingle();
  const cv = data?.course_versions as unknown as { course_id: string } | { course_id: string }[] | null;
  return (Array.isArray(cv) ? cv[0]?.course_id : cv?.course_id) ?? null;
}
import { meetsWatchRequirement, mergeRanges, watchedSeconds, type Range } from "./video-ranges.ts";

export interface ProgressResult {
  ok: boolean;
  watchedSeconds?: number;
  quizUnlocked?: boolean;
  /** Watch-only lessons: completed now that the video has been watched. */
  lessonCompleted?: boolean;
  nextLessonId?: string | null;
  courseCompleted?: boolean;
  /** After finishing a course: the next one to do, if any. */
  nextCourse?: NextCourse | null;
  error?: string;
}

/** Saves what the learner has watched. Re-checks enrolment and that the
 * lesson is unlocked on the server; merges ranges so rewatching or skipping
 * ahead never inflates the total. */
export async function saveVideoProgress(lessonId: string, ranges: Range[], positionSeconds: number): Promise<ProgressResult> {
  const { profile } = await requireProfile();
  const admin = createAdminClient();

  const { data: lesson } = await admin
    .from("lessons")
    .select("id, course_version_id, position, video_seconds, required_watch_ratio")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) return { ok: false, error: "Lesson not found." };

  const { data: enrolment } = await admin
    .from("enrolments")
    .select("id")
    .eq("learner_id", profile.id)
    .eq("course_version_id", lesson.course_version_id)
    .is("unassigned_at", null)
    .maybeSingle();
  if (!enrolment) return { ok: false, error: "This lesson isn't assigned to you." };

  // Training path: earlier courses must be finished first (migration 0010).
  const { data: lockedBy, error: lockErr } = await admin.rpc("course_lock_reason", { p_learner: profile.id, p_version: lesson.course_version_id });
  if (!lockErr && lockedBy) return { ok: false, error: `Finish "${lockedBy}" first. This course is still locked.` };

  // Earlier required lessons must be passed.
  const [{ data: earlier }, { data: done }] = await Promise.all([
    admin.from("lessons").select("id").eq("course_version_id", lesson.course_version_id).eq("is_required", true).lt("position", lesson.position),
    admin.from("lesson_completions").select("lesson_id").eq("enrolment_id", enrolment.id).is("revoked_at", null),
  ]);
  const doneIds = new Set((done ?? []).map((d) => d.lesson_id));
  if ((earlier ?? []).some((l) => !doneIds.has(l.id))) return { ok: false, error: "This lesson is still locked." };

  const { data: existing } = await admin
    .from("video_progress")
    .select("watched_ranges, quiz_unlocked_at")
    .eq("enrolment_id", enrolment.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const duration = lesson.video_seconds;
  const incoming = Array.isArray(ranges) ? ranges.slice(0, 500) : [];
  const merged = mergeRanges([...((existing?.watched_ranges as Range[] | null) ?? []), ...incoming], duration);
  const watched = watchedSeconds(merged);
  const unlockedNow = meetsWatchRequirement(watched, duration, Number(lesson.required_watch_ratio));
  const quizUnlockedAt = existing?.quiz_unlocked_at ?? (unlockedNow ? new Date().toISOString() : null);
  const position = Math.max(0, Math.min(duration, Number(positionSeconds) || 0));

  const { error } = await admin.from("video_progress").upsert(
    {
      enrolment_id: enrolment.id,
      lesson_id: lessonId,
      position_seconds: position,
      watched_ranges: merged,
      watched_seconds: watched,
      quiz_unlocked_at: quizUnlockedAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "enrolment_id,lesson_id" },
  );
  if (error) return { ok: false, error: "Your progress couldn't be saved. Check your connection and keep watching; it will retry." };

  if (quizUnlockedAt) {
    const done = await completeIfWatchOnly(lessonId, profile);
    if (done) return { ok: true, watchedSeconds: watched, quizUnlocked: true, ...done };
  }
  return { ok: true, watchedSeconds: watched, quizUnlocked: Boolean(quizUnlockedAt) };
}

/** For a lesson with no quiz: records it as complete once watched. Returns
 * null for lessons that have a quiz. Server-only helper (not exported as an action). */
async function completeIfWatchOnly(lessonId: string, profile: { id: string; fullName: string }) {
  const admin = createAdminClient();
  const { count } = await admin.from("quiz_questions").select("id", { count: "exact", head: true }).eq("lesson_id", lessonId);
  if ((count ?? 0) > 0) return null;

  const { data, error } = await admin.rpc("complete_watched_lesson", { p_learner: profile.id, p_lesson: lessonId });
  if (error) {
    if (!/NOT_WATCHED|LESSON_LOCKED/.test(error.message)) console.error(`[lesson] watch-only completion failed: ${error.message}`);
    return null;
  }
  const r = data as { newly_completed: boolean; next_lesson_id: string | null; course_completed: boolean; course_completed_at: string | null };
  if (r.newly_completed) {
    revalidatePath("/dashboard");
    revalidatePath(`/lessons/${lessonId}`);
    revalidatePath("/courses", "layout");
    if (r.course_completed && r.course_completed_at && Date.now() - new Date(r.course_completed_at).getTime() < 15_000) {
      await notifyCourseCompleted(lessonId, profile);
    }
  }
  let nextCourse: NextCourse | null = null;
  if (r.course_completed && !r.next_lesson_id) {
    const courseId = await courseIdOfLesson(lessonId);
    if (courseId) nextCourse = await findNextCourse(profile.id, courseId);
  }
  return { lessonCompleted: true, nextLessonId: r.next_lesson_id, courseCompleted: r.course_completed, nextCourse };
}

async function notifyCourseCompleted(lessonId: string, profile: { id: string; fullName: string }) {
  const admin = createAdminClient();
  const { data: info } = await admin.from("lessons").select("course_versions(title)").eq("id", lessonId).maybeSingle();
  const cv = info?.course_versions as unknown as { title: string } | { title: string }[] | null;
  const title = (Array.isArray(cv) ? cv[0]?.title : cv?.title) ?? "a course";
  await notifyAdmins({ kind: "course_completed", title: `${profile.fullName} completed ${title}`, link: `/admin/staff/${profile.id}` }, profile.id);
}

export interface QuizResult {
  ok: boolean;
  error?: string;
  passed?: boolean;
  correct?: number;
  total?: number;
  passPercent?: number;
  nextLessonId?: string | null;
  courseCompleted?: boolean;
  nextCourse?: NextCourse | null;
  results?: { questionId: string; selectedOptionId: string; isCorrect: boolean; correctOptionId: string | null; explanation: string }[];
}

const errorMessages: Record<string, string> = {
  NOT_ENROLLED: "This lesson isn't assigned to you.",
  COURSE_LOCKED: "Finish the earlier course in your training first. This one is still locked.",
  LESSON_LOCKED: "Pass the earlier lessons first. This one is still locked.",
  QUIZ_LOCKED: "Watch more of the video to unlock the quiz.",
  INCOMPLETE_ANSWERS: "Answer every question before submitting.",
  NO_QUESTIONS: "This lesson doesn't have a quiz yet.",
  LESSON_NOT_FOUND: "Lesson not found.",
};

/** Scores the quiz on the server (answer keys never leave the database) and
 * records the attempt, completion and course completion in one step. */
export async function submitQuiz(lessonId: string, answers: Record<string, string>, startedAt?: string | null): Promise<QuizResult> {
  const { profile } = await requireProfile();
  const admin = createAdminClient();

  const started = startedAt && !Number.isNaN(Date.parse(startedAt)) ? new Date(startedAt).toISOString() : null;
  let { data, error } = await admin.rpc("submit_quiz_attempt", {
    p_learner: profile.id,
    p_lesson: lessonId,
    p_answers: answers,
    p_started_at: started,
  });
  // Before migration 0013 there's no start-time version: submit without it.
  if (error && /p_started_at|Could not find the function|function .* does not exist/i.test(error.message)) {
    ({ data, error } = await admin.rpc("submit_quiz_attempt", { p_learner: profile.id, p_lesson: lessonId, p_answers: answers }));
  }
  if (error) {
    const code = Object.keys(errorMessages).find((c) => error.message.includes(c));
    if (!code) console.error(`[quiz] submit failed: ${error.message}`);
    return { ok: false, error: code ? errorMessages[code] : "Your answers couldn't be submitted. Try again." };
  }

  const r = data as {
    passed: boolean; correct: number; total: number; pass_ratio: number; next_lesson_id: string | null; course_completed: boolean;
    course_completed_at: string | null;
    results: { question_id: string; selected_option_id: string; is_correct: boolean; correct_option_id: string | null; explanation: string }[];
  };

  // This attempt finished the course (not a retake after completing): tell the admins.
  if (r.passed && r.course_completed_at && Date.now() - new Date(r.course_completed_at).getTime() < 15_000) {
    await notifyCourseCompleted(lessonId, profile);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/lessons/${lessonId}`);
  revalidatePath("/courses", "layout");

  let nextCourse: NextCourse | null = null;
  if (r.passed && r.course_completed && !r.next_lesson_id) {
    const courseId = await courseIdOfLesson(lessonId);
    if (courseId) nextCourse = await findNextCourse(profile.id, courseId);
  }

  return {
    ok: true,
    nextCourse,
    passed: r.passed,
    correct: r.correct,
    total: r.total,
    passPercent: Math.round(Number(r.pass_ratio) * 100),
    nextLessonId: r.next_lesson_id,
    courseCompleted: r.course_completed,
    results: r.results.map((x) => ({
      questionId: x.question_id,
      selectedOptionId: x.selected_option_id,
      isCorrect: x.is_correct,
      correctOptionId: x.correct_option_id,
      explanation: x.explanation,
    })),
  };
}

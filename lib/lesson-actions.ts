"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "./auth";
import { createAdminClient } from "./supabase/admin";
import { meetsWatchRequirement, mergeRanges, watchedSeconds, type Range } from "./video-ranges.ts";

export interface ProgressResult {
  ok: boolean;
  watchedSeconds?: number;
  quizUnlocked?: boolean;
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

  return { ok: true, watchedSeconds: watched, quizUnlocked: Boolean(quizUnlockedAt) };
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
  results?: { questionId: string; selectedOptionId: string; isCorrect: boolean; correctOptionId: string | null; explanation: string }[];
}

const errorMessages: Record<string, string> = {
  NOT_ENROLLED: "This lesson isn't assigned to you.",
  LESSON_LOCKED: "Pass the earlier lessons first. This one is still locked.",
  QUIZ_LOCKED: "Watch more of the video to unlock the quiz.",
  INCOMPLETE_ANSWERS: "Answer every question before submitting.",
  NO_QUESTIONS: "This lesson doesn't have a quiz yet.",
  LESSON_NOT_FOUND: "Lesson not found.",
};

/** Scores the quiz on the server (answer keys never leave the database) and
 * records the attempt, completion and course completion in one step. */
export async function submitQuiz(lessonId: string, answers: Record<string, string>): Promise<QuizResult> {
  const { profile } = await requireProfile();
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("submit_quiz_attempt", {
    p_learner: profile.id,
    p_lesson: lessonId,
    p_answers: answers,
  });
  if (error) {
    const code = Object.keys(errorMessages).find((c) => error.message.includes(c));
    if (!code) console.error(`[quiz] submit failed: ${error.message}`);
    return { ok: false, error: code ? errorMessages[code] : "Your answers couldn't be submitted. Try again." };
  }

  const r = data as {
    passed: boolean; correct: number; total: number; pass_ratio: number; next_lesson_id: string | null; course_completed: boolean;
    results: { question_id: string; selected_option_id: string; is_correct: boolean; correct_option_id: string | null; explanation: string }[];
  };

  revalidatePath("/dashboard");
  revalidatePath(`/lessons/${lessonId}`);
  revalidatePath("/courses", "layout");

  return {
    ok: true,
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

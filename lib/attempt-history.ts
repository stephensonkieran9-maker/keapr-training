import "server-only";
import { createAdminClient } from "./supabase/admin";

export interface ReviewedAnswer {
  questionId: string;
  position: number;
  prompt: string;
  chosen: string | null;
  isCorrect: boolean;
  /** Only filled in once the learner has passed this lesson. */
  correct: string | null;
  explanation: string;
}

export interface ReviewedAttempt {
  id: string;
  number: number;
  submittedAt: string;
  correct: number;
  total: number;
  passed: boolean;
  answers: ReviewedAnswer[];
}

/** A learner's past quiz attempts on one lesson, newest first, with what they
 * answered. The caller must already have checked the enrolment is theirs.
 * Correct answers are only included once they've passed the lesson, the same
 * rule as the live quiz, so a failed attempt can't be used as an answer key. */
export async function getAttemptHistory(enrolmentId: string, lessonId: string, revealCorrect: boolean): Promise<ReviewedAttempt[]> {
  const admin = createAdminClient();
  const [{ data: attempts }, { data: questions }] = await Promise.all([
    admin
      .from("quiz_attempts")
      .select("id, submitted_at, correct_count, question_count, passed, submitted_answers")
      .eq("enrolment_id", enrolmentId)
      .eq("lesson_id", lessonId)
      .order("submitted_at", { ascending: true }),
    admin
      .from("quiz_questions")
      .select("id, position, prompt, explanation, quiz_options(id, label), quiz_answer_keys(correct_option_id)")
      .eq("lesson_id", lessonId)
      .order("position"),
  ]);
  if (!attempts?.length || !questions) return [];

  type Q = {
    id: string; position: number; prompt: string; explanation: string;
    quiz_options: { id: string; label: string }[] | null;
    quiz_answer_keys: { correct_option_id: string } | { correct_option_id: string }[] | null;
  };
  const qs = (questions as unknown as Q[]).map((q) => {
    const key = Array.isArray(q.quiz_answer_keys) ? q.quiz_answer_keys[0] : q.quiz_answer_keys;
    const labels = new Map((q.quiz_options ?? []).map((o) => [o.id, o.label]));
    return { ...q, correctId: key?.correct_option_id ?? null, labels };
  });

  return attempts
    .map((a, i) => {
      const picked = (a.submitted_answers ?? {}) as Record<string, string>;
      return {
        id: a.id as string,
        number: i + 1,
        submittedAt: a.submitted_at as string,
        correct: a.correct_count as number,
        total: a.question_count as number,
        passed: a.passed as boolean,
        answers: qs.map((q) => {
          const chosenId = picked[q.id] ?? null;
          return {
            questionId: q.id,
            position: q.position,
            prompt: q.prompt,
            chosen: chosenId ? (q.labels.get(chosenId) ?? null) : null,
            isCorrect: Boolean(chosenId && chosenId === q.correctId),
            correct: revealCorrect && q.correctId ? (q.labels.get(q.correctId) ?? null) : null,
            explanation: q.explanation,
          };
        }),
      };
    })
    .reverse();
}

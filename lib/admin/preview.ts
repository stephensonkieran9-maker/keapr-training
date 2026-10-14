// Admin "preview as learner": builds lesson and quiz data from a course
// draft and scores answers against it. Pure, so it's tested. Nothing here
// touches learner records.

import { cleanDraft, type CourseDraft, type DraftLesson } from "./draft.ts";

export const questionId = (qi: number) => `q${qi}`;
export const optionId = (qi: number, oi: number) => `q${qi}o${oi}`;

/** Questions as the learner sees them: no correct answers. */
export function previewQuestions(lesson: DraftLesson) {
  return lesson.questions.map((q, qi) => ({
    id: questionId(qi),
    prompt: q.prompt || `Question ${qi + 1} (no text yet)`,
    options: q.options.map((label, oi) => ({ id: optionId(qi, oi), label })),
  }));
}

export interface PreviewScore {
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

/** Scores like the real quiz: every question answered, exact-ratio pass. */
export function scorePreview(raw: CourseDraft, lessonIndex: number, answers: Record<string, string>): PreviewScore {
  const draft = cleanDraft(raw);
  const lesson = draft.lessons[lessonIndex];
  if (!lesson) return { ok: false, error: "Lesson not found. Save the course and reload the preview." };
  if (lesson.questions.length === 0) return { ok: false, error: "This lesson doesn't have a quiz yet." };

  const results = lesson.questions.map((q, qi) => {
    const selected = answers?.[questionId(qi)] ?? "";
    const correctId = q.correctIndex >= 0 ? optionId(qi, q.correctIndex) : null;
    return { questionId: questionId(qi), selectedOptionId: selected, isCorrect: correctId !== null && selected === correctId, correctOptionId: correctId, explanation: q.explanation };
  });
  if (results.some((r) => !r.selectedOptionId)) return { ok: false, error: "Answer every question before submitting." };

  const correct = results.filter((r) => r.isCorrect).length;
  const total = results.length;
  const passed = correct * 100 >= lesson.passPercent * total;
  const isLast = lessonIndex === draft.lessons.length - 1;
  return {
    ok: true,
    passed,
    correct,
    total,
    passPercent: lesson.passPercent,
    nextLessonId: passed && !isLast ? String(lessonIndex + 1) : null,
    courseCompleted: passed && isLast,
    // Same rule as the live quiz: the right answer is shown only on a pass.
    results: results.map((r) => ({ ...r, correctOptionId: passed ? r.correctOptionId : null })),
  };
}

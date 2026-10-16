import { test } from "node:test";
import assert from "node:assert/strict";
import { previewQuestions, scorePreview } from "../lib/admin/preview.ts";
import type { CourseDraft } from "../lib/admin/draft.ts";

const q = (correctIndex: number, options = ["A", "B", "C"]) => ({ key: "k", prompt: "P", options, correctIndex, explanation: "E" });
const lesson = (questions: ReturnType<typeof q>[], passPercent = 80) => ({
  key: "l", title: "L", objectives: [], notes: "", videoRef: "", videoSeconds: 60, passPercent, requiredWatchPercent: 90,
  isRequired: true, estimatedMinutes: null, hasQuiz: true, questions,
});
const draft: CourseDraft = { lessons: [lesson([q(0), q(1), q(2), q(0), q(1)]), lesson([q(1)])] };
const answers = (picks: number[]) => Object.fromEntries(picks.map((p, i) => [`q${i}`, `q${i}o${p}`]));

test("preview questions never include the answer", () => {
  const qs = previewQuestions(draft.lessons[0]);
  assert.equal(qs.length, 5);
  assert.ok(!JSON.stringify(qs).includes("correct"));
});

test("4 of 5 passes at 80% and unlocks the next preview lesson", () => {
  const r = scorePreview(draft, 0, answers([0, 1, 2, 0, 0]));
  assert.equal(r.passed, true);
  assert.equal(r.correct, 4);
  assert.equal(r.nextLessonId, "1");
  assert.equal(r.results![4].correctOptionId, "q4o1");
});

test("3 of 5 fails and hides correct answers", () => {
  const r = scorePreview(draft, 0, answers([0, 1, 2, 2, 2]));
  assert.equal(r.passed, false);
  assert.equal(r.nextLessonId, null);
  assert.ok(r.results!.every((x) => x.correctOptionId === null));
});

test("unanswered questions are rejected", () => {
  const r = scorePreview(draft, 0, answers([0, 1]));
  assert.equal(r.ok, false);
});

test("passing the last lesson completes the preview course", () => {
  const r = scorePreview(draft, 1, answers([1]));
  assert.equal(r.courseCompleted, true);
  assert.equal(r.nextLessonId, null);
});

test("blank options are removed with the correct answer kept", () => {
  const d: CourseDraft = { lessons: [lesson([q(2, ["A", "", "C"])])] };
  assert.deepEqual(previewQuestions({ ...d.lessons[0], questions: [{ ...d.lessons[0].questions[0], options: ["A", "C"], correctIndex: 1 }] })[0].options.length, 2);
  assert.equal(scorePreview(d, 0, { q0: "q0o1" }).passed, true);
});

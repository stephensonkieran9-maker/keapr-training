import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCourseDetail, type DetailInput } from "../lib/admin/attempt-detail.ts";

const q = (id: string, position: number, correct: string) => ({
  id, position, prompt: `Question ${position}`, correctOptionId: correct,
  options: [{ id: `${id}a`, label: `${id} A` }, { id: `${id}b`, label: `${id} B` }],
});

const input: DetailInput = {
  assignedAt: "2026-10-26T08:00:00Z",
  completedAt: "2026-10-26T10:30:00Z",
  lessons: [
    { id: "w", position: 1, title: "Welcome video", videoSeconds: 450, isRequired: true, questions: [] },
    { id: "l2", position: 2, title: "Store it", videoSeconds: 300, isRequired: true, questions: [q("q1", 1, "q1a"), q("q2", 2, "q2a"), q("q3", 3, "q3a")] },
  ],
  attempts: [
    { id: "a1", lessonId: "l2", answers: { q1: "q1a", q2: "q2b", q3: "q3b" }, correct: 1, total: 3, passRatio: 0.8, passed: false, submittedAt: "2026-10-26T10:05:00Z", startedAt: "2026-10-26T10:02:30Z" },
    { id: "a2", lessonId: "l2", answers: { q1: "q1a", q2: "q2a", q3: "q3b" }, correct: 2, total: 3, passRatio: 0.8, passed: false, submittedAt: "2026-10-26T10:15:00Z", startedAt: null },
    { id: "a3", lessonId: "l2", answers: { q1: "q1a", q2: "q2a", q3: "q3a" }, correct: 3, total: 3, passRatio: 0.8, passed: true, submittedAt: "2026-10-26T10:30:00Z", startedAt: "2026-10-26T10:28:00Z" },
  ],
  completions: [
    { lessonId: "w", source: "watched", completedAt: "2026-10-26T09:10:00Z", overrideReason: null },
    { lessonId: "l2", source: "quiz_pass", completedAt: "2026-10-26T10:30:00Z", overrideReason: null },
  ],
  video: [
    { lessonId: "w", watchedSeconds: 451, createdAt: "2026-10-26T09:00:00Z", updatedAt: "2026-10-26T09:10:00Z" },
    { lessonId: "l2", watchedSeconds: 290, createdAt: "2026-10-26T09:45:00Z", updatedAt: "2026-10-26T10:00:00Z" },
  ],
};

test("attempts are numbered with score, time taken and wrong answers", () => {
  const d = buildCourseDetail(input);
  const l2 = d.lessons[1];
  assert.deepEqual(l2.attempts.map((a) => [a.number, a.percent, a.passed, a.durationSeconds]), [[1, 33, false, 150], [2, 66, false, null], [3, 100, true, 120]]);
  assert.deepEqual(l2.attempts[0].wrong, [
    { position: 2, prompt: "Question 2", chosen: "q2 B", correct: "q2 A" },
    { position: 3, prompt: "Question 3", chosen: "q3 B", correct: "q3 A" },
  ]);
  assert.equal(l2.bestPercent, 100);
});

test("lesson and course timings come from first activity to completion", () => {
  const d = buildCourseDetail(input);
  assert.equal(d.lessons[0].timeToCompleteSeconds, 600);
  assert.equal(d.lessons[0].completedBy, "watched");
  assert.equal(d.lessons[0].watchedSeconds, 450); // capped at the video length
  assert.equal(d.lessons[1].timeToCompleteSeconds, 45 * 60);
  assert.equal(d.startedAt, "2026-10-26T09:00:00Z");
  assert.equal(d.elapsedSeconds, 90 * 60);
  assert.equal(d.totalAttempts, 3);
  assert.equal(d.passedFirstTime, 0);
  assert.equal(d.quizLessons, 1);
});

test("most-missed questions are ranked", () => {
  const d = buildCourseDetail(input);
  assert.deepEqual(d.mostMissed.map((m) => [m.position, m.misses]), [[3, 2], [2, 1]]);
});

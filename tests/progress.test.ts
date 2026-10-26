import { test } from "node:test";
import assert from "node:assert/strict";
import { computeProgress, isPass, key, type EnrolmentRow, type ProgressInput } from "../lib/progress.ts";

test("pass mark uses the exact ratio, not a rounded score", () => {
  assert.equal(isPass(4, 5, 0.8), true); // 80% passes
  assert.equal(isPass(3, 4, 0.8), false); // 75% fails
  assert.equal(isPass(5, 7, 0.8), false); // 71.4% fails
  assert.equal(isPass(13, 16, 0.8), true); // 81.25% passes
  assert.equal(isPass(79, 99, 0.8), false); // 79.8% would round to 80 but must fail
  assert.equal(isPass(0, 0, 0.8), false); // no questions never passes
});

const lesson = (id: string, position: number, isRequired = true) => ({
  id, position, title: `Lesson ${position}`, videoSeconds: 120, requiredWatchRatio: 0.9,
  passRatio: 0.8, isRequired, estimatedMinutes: 5, objectives: [],
});

const enrolment = (id: string, lessons = [lesson("a", 1), lesson("b", 2), lesson("c", 3)]): EnrolmentRow => ({
  enrolmentId: id, courseId: `course-${id}`, title: `Course ${id}`, description: "", isDemo: true,
  completedAt: null, assignedAt: "2026-10-01T00:00:00Z", lessons,
});

const input = (over: Partial<ProgressInput> = {}): ProgressInput => ({
  enrolments: [enrolment("e1")],
  completedLessonKeys: new Set(),
  attempts: [],
  watchedSeconds: new Map(),
  ...over,
});

test("a new course: first lesson available, the rest locked", () => {
  const p = computeProgress(input());
  assert.deepEqual(p.stepsByEnrolment.get("e1")!.map((s) => s.state), ["available", "locked", "locked"]);
  assert.equal(p.courses[0].status, "not_started");
  assert.equal(p.nextLesson?.lessonId, "a");
});

test("passing lesson 1 unlocks lesson 2 only", () => {
  const p = computeProgress(input({ completedLessonKeys: new Set([key("e1", "a")]) }));
  assert.deepEqual(p.stepsByEnrolment.get("e1")!.map((s) => s.state), ["passed", "available", "locked"]);
  assert.equal(p.courses[0].status, "in_progress");
  assert.equal(p.courses[0].lessonsPassed, 1);
  assert.equal(p.nextLesson?.lessonId, "b");
});

test("a later failed retry does not remove a pass", () => {
  const p = computeProgress(input({
    completedLessonKeys: new Set([key("e1", "a")]),
    attempts: [
      { enrolmentId: "e1", lessonId: "a", correctCount: 3, questionCount: 3 },
      { enrolmentId: "e1", lessonId: "a", correctCount: 1, questionCount: 3 },
    ],
  }));
  const first = p.stepsByEnrolment.get("e1")![0];
  assert.equal(first.state, "passed");
  assert.equal(first.bestScorePercent, 100);
});

test("all required lessons passed completes the course and clears the next lesson", () => {
  const p = computeProgress(input({ completedLessonKeys: new Set(["a", "b", "c"].map((l) => key("e1", l))) }));
  assert.equal(p.courses[0].status, "completed");
  assert.equal(p.nextLesson, null);
});

test("an optional lesson doesn't block the next one", () => {
  const p = computeProgress(input({ enrolments: [enrolment("e1", [lesson("a", 1, false), lesson("b", 2), lesson("c", 3)])] }));
  assert.deepEqual(p.stepsByEnrolment.get("e1")!.map((s) => s.state), ["available", "available", "locked"]);
});

test("watching a video marks the course in progress", () => {
  const p = computeProgress(input({ watchedSeconds: new Map([[key("e1", "a"), 30]]) }));
  assert.equal(p.courses[0].status, "in_progress");
  assert.equal(p.nextLesson?.watchedSeconds, 30);
});

test("locked reason after a watch-only lesson says to finish watching", async () => {
  const { lessonSteps } = await import("../lib/progress.ts");
  const base = { videoSeconds: 60, requiredWatchRatio: 1, passRatio: 0.8, isRequired: true, estimatedMinutes: null, objectives: [] };
  const e = {
    enrolmentId: "e", courseId: "c", title: "T", description: "", isDemo: false, completedAt: null, assignedAt: "2026-10-01",
    lessons: [{ ...base, id: "a", position: 1, title: "Welcome", hasQuiz: false }, { ...base, id: "b", position: 2, title: "Next" }],
  };
  const steps = lessonSteps(e, { enrolments: [e], completedLessonKeys: new Set(), attempts: [], watchedSeconds: new Map() });
  assert.equal(steps[1].lockedReason, "Finish watching lesson 1 to unlock");
});

test("a course waiting on an earlier path course is fully locked and skipped for Next lesson", async () => {
  const { computeProgress } = await import("../lib/progress.ts");
  const lesson = (id: string, position: number) => ({ id, position, title: id, videoSeconds: 60, requiredWatchRatio: 0.9, passRatio: 0.8, isRequired: true, estimatedMinutes: null, objectives: [] });
  const a = { enrolmentId: "ea", courseId: "A", title: "Welcome", description: "", isDemo: false, completedAt: null, assignedAt: "2026-10-02", lessons: [lesson("a1", 1)] };
  const b = { enrolmentId: "eb", courseId: "B", title: "Arbitrage", description: "", isDemo: false, completedAt: null, assignedAt: "2026-10-01", lessons: [lesson("b1", 1)], lockedBy: "Welcome" };
  const r = computeProgress({ enrolments: [a, b], completedLessonKeys: new Set(), attempts: [], watchedSeconds: new Map() });
  assert.equal(r.stepsByEnrolment.get("eb")![0].state, "locked");
  assert.equal(r.stepsByEnrolment.get("eb")![0].lockedReason, 'Finish "Welcome" first');
  assert.equal(r.courses[1].lockedBy, "Welcome");
  assert.equal(r.nextLesson?.lessonId, "a1"); // B is older but locked
});

test("next course after finishing one skips completed and locked courses, in order", async () => {
  const { computeProgress, nextCourseAfter } = await import("../lib/progress.ts");
  const lesson = (id: string) => ({ id, position: 1, title: id, videoSeconds: 60, requiredWatchRatio: 0.9, passRatio: 0.8, isRequired: true, estimatedMinutes: null, objectives: [] });
  const base = { description: "", isDemo: false, assignedAt: "2026-10-01" };
  const a = { ...base, enrolmentId: "ea", courseId: "A", title: "Welcome", completedAt: "2026-10-02", lessons: [lesson("a1")] };
  const b = { ...base, enrolmentId: "eb", courseId: "B", title: "Bookings Hunter", completedAt: null, lessons: [lesson("b1")] };
  const c = { ...base, enrolmentId: "ec", courseId: "C", title: "SPRINT", completedAt: null, lessons: [lesson("c1")], lockedBy: "Bookings Hunter" };
  const computed = computeProgress({ enrolments: [a, b, c], completedLessonKeys: new Set(["ea:a1"]), attempts: [], watchedSeconds: new Map() });
  assert.deepEqual(nextCourseAfter(computed, "A"), { courseId: "B", title: "Bookings Hunter", lessonId: "b1" });
  const done = computeProgress({ enrolments: [a, { ...b, completedAt: "2026-10-03" }], completedLessonKeys: new Set(["ea:a1", "eb:b1"]), attempts: [], watchedSeconds: new Map() });
  assert.equal(nextCourseAfter(done, "B"), null);
});

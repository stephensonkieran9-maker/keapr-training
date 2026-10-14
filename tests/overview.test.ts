import { test } from "node:test";
import assert from "node:assert/strict";
import { computeOverview, type OverviewInput } from "../lib/admin/overview.ts";
import { sampleOverviewInput } from "../lib/admin/overview-sample.ts";

const now = new Date("2026-10-14T12:00:00Z");
const base = (): OverviewInput => ({
  now,
  people: [
    { id: "a", name: "Alex", role: "learner", isActive: true, lastSignInAt: "2026-10-13T09:00:00Z", createdAt: "2026-10-01T09:00:00Z" },
    { id: "b", name: "Bea", role: "learner", isActive: true, lastSignInAt: null, createdAt: "2026-10-01T09:00:00Z" },
    { id: "x", name: "Gone", role: "learner", isActive: false, lastSignInAt: null, createdAt: "2026-10-01T09:00:00Z" },
  ],
  courses: [{ versionId: "v1", courseId: "c1", title: "Course", lessons: [
    { id: "l1", title: "One", position: 1, isRequired: true },
    { id: "l2", title: "Two", position: 2, isRequired: true },
  ] }],
  enrolments: [
    { id: "ea", learnerId: "a", versionId: "v1", assignedAt: "2026-10-02T09:00:00Z", completedAt: null },
    { id: "eb", learnerId: "b", versionId: "v1", assignedAt: "2026-10-02T09:00:00Z", completedAt: null },
    { id: "ex", learnerId: "x", versionId: "v1", assignedAt: "2026-10-02T09:00:00Z", completedAt: null },
  ],
  completions: [{ enrolmentId: "ea", lessonId: "l1", completedAt: "2026-10-12T10:00:00Z" }],
  attempts: [
    { enrolmentId: "ea", lessonId: "l1", passed: false, submittedAt: "2026-10-12T09:00:00Z" },
    { enrolmentId: "ea", lessonId: "l1", passed: true, submittedAt: "2026-10-12T10:00:00Z" },
    { enrolmentId: "ea", lessonId: "l2", passed: false, submittedAt: "2026-10-13T10:00:00Z" },
    { enrolmentId: "ea", lessonId: "l2", passed: false, submittedAt: "2026-10-13T11:00:00Z" },
    { enrolmentId: "ea", lessonId: "l2", passed: false, submittedAt: "2026-10-13T12:00:00Z" },
  ],
  videoActivity: [],
});

test("deactivated people are left out", () => {
  const o = computeOverview(base());
  assert.equal(o.kpis.learners, 2);
  assert.equal(o.kpis.assignments, 2);
});

test("course breakdown and matrix reflect progress", () => {
  const o = computeOverview(base());
  assert.deepEqual(o.courses[0], { courseId: "c1", title: "Course", notStarted: 1, inProgress: 1, completed: 0, total: 2 });
  const alex = o.staff.find((s) => s.id === "a")!;
  assert.equal(alex.cells.c1?.percent, 50);
  assert.equal(alex.overallPercent, 50);
});

test("first-time pass rate counts only first attempts", () => {
  const o = computeOverview(base());
  // l1 first attempt failed, l2 first attempt failed → 0%
  assert.equal(o.kpis.firstTimePassRate, 0);
});

test("struggling lessons ranked by failures, with learners still stuck", () => {
  const o = computeOverview(base());
  assert.equal(o.stuck[0].lessonId, "l2");
  assert.equal(o.stuck[0].failed, 3);
  assert.equal(o.stuck[0].learnersStuck, 1);
  assert.equal(o.stuck[1].learnersStuck, 0); // l1 was passed later
});

test("needs attention flags repeated fails and never signed in", () => {
  const o = computeOverview(base());
  const reasons = o.attention.map((a) => `${a.name}: ${a.reason}`);
  assert.ok(reasons.some((r) => r.startsWith("Alex: Failed \"Two\" 3 times")));
  assert.ok(reasons.some((r) => r.startsWith("Bea: Invited")));
  assert.equal(o.attention[0].severity, "serious");
});

test("activity covers 30 days ending today", () => {
  const o = computeOverview(base());
  assert.equal(o.activity.length, 30);
  assert.equal(o.activity.at(-1)!.date, "2026-10-14");
  const oct13 = o.activity.find((d) => d.date === "2026-10-13")!;
  assert.equal(oct13.failed, 3);
});

test("sample data produces a full overview", () => {
  const o = computeOverview(sampleOverviewInput(now));
  assert.equal(o.kpis.learners, 9);
  assert.ok(o.stuck.length > 0);
  assert.ok(o.attention.length > 0);
  assert.ok(o.hasActivity);
});

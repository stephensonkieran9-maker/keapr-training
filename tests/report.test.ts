import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAttempts, buildReport, filterReport, parseFilters, reportCsv, toCsv, type ReportInput } from "../lib/admin/report.ts";

const input: ReportInput = {
  people: [
    { id: "p1", name: "Amy Able", email: "amy@x.co", isActive: true },
    { id: "p2", name: "Ben Best", email: "ben@x.co", isActive: true },
    { id: "p3", name: "Cat Gone", email: "cat@x.co", isActive: false },
  ],
  courses: [
    { versionId: "v1", courseId: "c1", title: "Arbitrage basics", version: 2, lessons: [
      { id: "l1", title: "One", position: 1, isRequired: true },
      { id: "l2", title: "Two", position: 2, isRequired: true },
      { id: "l3", title: "Extra", position: 3, isRequired: false },
    ] },
  ],
  enrolments: [
    { id: "e1", learnerId: "p1", versionId: "v1", assignedAt: "2026-10-01T09:00:00Z", completedAt: "2026-10-05T10:00:00Z" },
    { id: "e2", learnerId: "p2", versionId: "v1", assignedAt: "2026-10-01T09:00:00Z", completedAt: null },
    { id: "e3", learnerId: "p3", versionId: "v1", assignedAt: "2026-10-01T09:00:00Z", completedAt: null },
  ],
  completions: [
    { enrolmentId: "e1", lessonId: "l1", completedAt: "2026-10-03T10:00:00Z" },
    { enrolmentId: "e1", lessonId: "l2", completedAt: "2026-10-05T10:00:00Z" },
  ],
  attempts: [
    { enrolmentId: "e1", lessonId: "l1", correct: 3, total: 5, passRatio: 0.8, passed: false, submittedAt: "2026-10-02T10:00:00Z" },
    { enrolmentId: "e1", lessonId: "l1", correct: 5, total: 5, passRatio: 0.8, passed: true, submittedAt: "2026-10-03T10:00:00Z" },
    { enrolmentId: "e1", lessonId: "l2", correct: 4, total: 5, passRatio: 0.8, passed: true, submittedAt: "2026-10-05T10:00:00Z" },
  ],
  videoActivity: [{ enrolmentId: "e2", updatedAt: "2026-10-04T08:00:00Z" }],
};

test("one row per assignment with status and progress from required lessons", () => {
  const rows = buildReport(input);
  assert.equal(rows.length, 3);
  const amy = rows.find((r) => r.personId === "p1")!;
  assert.equal(amy.status, "completed");
  assert.equal(amy.lessonsPassed, 2);
  assert.equal(amy.lessonsRequired, 2);
  assert.equal(amy.attempts, 3);
  assert.equal(amy.failedAttempts, 1);
  const ben = rows.find((r) => r.personId === "p2")!;
  assert.equal(ben.status, "in_progress"); // watched video, nothing passed yet
  assert.equal(ben.lastActivityAt, "2026-10-04T08:00:00Z");
  assert.equal(rows.find((r) => r.personId === "p3")!.status, "not_started");
});

test("filters: deactivated hidden by default, search, status, course", () => {
  const rows = buildReport(input);
  assert.equal(filterReport(rows, {}).length, 2);
  assert.equal(filterReport(rows, { inactive: true }).length, 3);
  assert.equal(filterReport(rows, { q: "BEN@" }).length, 1);
  assert.equal(filterReport(rows, { status: "completed" }).length, 1);
  assert.equal(filterReport(rows, { course: "nope" }).length, 0);
});

test("parseFilters ignores unknown status values", () => {
  assert.deepEqual(parseFilters({ status: "bogus", inactive: "1", q: "a" }), { q: "a", course: "", status: "", inactive: true, path: "" });
});

test("attempts are numbered per lesson in order", () => {
  const rows = buildAttempts(input, new Set(["e1"]));
  assert.deepEqual(rows.map((r) => [r.lessonPosition, r.attemptNumber, r.passed]), [[1, 1, false], [1, 2, true], [2, 1, true]]);
  assert.equal(rows[0].scorePercent, 60);
});

test("CSV quotes commas and neutralises formulas", () => {
  assert.equal(toCsv(["a", "b"], [["x, y", "=SUM(A1)"]]), 'a,b\r\n"x, y",\'=SUM(A1)\r\n');
  const csv = reportCsv(buildReport(input));
  assert.ok(csv.startsWith("Name,Email,Account,Course"));
  assert.ok(csv.includes("Amy Able,amy@x.co,Active,Arbitrage basics,2,Completed,2,2,100,3,1,2026-10-01,2026-10-05,2026-10-05"));
});

test("path filter keeps only people on the path and courses in it", () => {
  const rows = buildReport(input);
  const paths = [{ id: "p", name: "Arbitrage", courseIds: ["c1"], memberIds: ["p1"] }];
  assert.deepEqual(filterReport(rows, { path: "p" }, paths).map((r) => r.personId), ["p1"]);
  assert.equal(filterReport(rows, { path: "missing" }, paths).length, 0);
  assert.equal(parseFilters({ path: "p" }).path, "p");
});

test("attempts export lists wrong questions and time taken when known", () => {
  const withDetail = {
    ...input,
    attempts: [{ ...input.attempts[0], startedAt: "2026-10-02T09:57:30Z", answers: { qa: "right", qb: "wrong" } }],
    answerKeys: [
      { lessonId: "l1", questionId: "qa", position: 1, correctOptionId: "right" },
      { lessonId: "l1", questionId: "qb", position: 2, correctOptionId: "right" },
    ],
  };
  const [row] = buildAttempts(withDetail, new Set(["e1"]));
  assert.equal(row.wrongQuestions, "Q2");
  assert.equal(row.durationSeconds, 150);
  const [plain] = buildAttempts(input, new Set(["e1"]));
  assert.equal(plain.wrongQuestions, "");
  assert.equal(plain.durationSeconds, null);
});

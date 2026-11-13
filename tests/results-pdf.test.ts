import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCourseDetail } from "../lib/admin/attempt-detail.ts";
import { buildResultsPdf, pdfSafe, resultsFileName, type ResultsCourse } from "../lib/admin/results-pdf.ts";

const q = (id: string, position: number, prompt: string) => ({
  id, position, prompt, correctOptionId: `${id}a`,
  options: [{ id: `${id}a`, label: "The right one" }, { id: `${id}b`, label: "A wrong one → with an arrow" }],
});

export function sampleCourse(title = "Keapr Bookings Hunter"): ResultsCourse {
  const detail = buildCourseDetail({
    assignedAt: "2026-11-02T09:00:00Z",
    completedAt: "2026-11-03T11:40:00Z",
    lessons: [
      { id: "w", position: 1, title: "From Balloon to Keapr", videoSeconds: 420, isRequired: true, questions: [] },
      { id: "l2", position: 2, title: "Finding bookings – the “hunter” mindset", videoSeconds: 610, isRequired: true, questions: [q("q1", 1, "What's the first thing you check on a new lead?"), q("q2", 2, "Which cancellation policy do we always use?"), q("q3", 3, "When does the 90+ night discount apply?")] },
      { id: "l3", position: 3, title: "Handling objections", videoSeconds: 540, isRequired: true, questions: [q("q4", 1, "A prospect says it's too expensive. What do you do?")] },
    ],
    attempts: [
      { id: "a1", lessonId: "l2", answers: { q1: "q1a", q2: "q2b", q3: "q3b" }, correct: 1, total: 3, passRatio: 0.8, passed: false, submittedAt: "2026-11-02T10:05:00Z", startedAt: "2026-11-02T10:02:30Z" },
      { id: "a2", lessonId: "l2", answers: { q1: "q1a", q2: "q2a", q3: "q3a" }, correct: 3, total: 3, passRatio: 0.8, passed: true, submittedAt: "2026-11-02T10:30:00Z", startedAt: "2026-11-02T10:28:00Z" },
      { id: "a3", lessonId: "l3", answers: { q4: "q4a" }, correct: 1, total: 1, passRatio: 0.8, passed: true, submittedAt: "2026-11-03T11:40:00Z", startedAt: null },
    ],
    completions: [
      { lessonId: "w", source: "watched", completedAt: "2026-11-02T09:20:00Z", overrideReason: null },
      { lessonId: "l2", source: "quiz_pass", completedAt: "2026-11-02T10:30:00Z", overrideReason: null },
      { lessonId: "l3", source: "quiz_pass", completedAt: "2026-11-03T11:40:00Z", overrideReason: null },
    ],
    video: [
      { lessonId: "w", watchedSeconds: 420, createdAt: "2026-11-02T09:12:00Z", updatedAt: "2026-11-02T09:20:00Z" },
      { lessonId: "l2", watchedSeconds: 600, createdAt: "2026-11-02T09:40:00Z", updatedAt: "2026-11-02T10:00:00Z" },
      { lessonId: "l3", watchedSeconds: 530, createdAt: "2026-11-03T11:00:00Z", updatedAt: "2026-11-03T11:30:00Z" },
    ],
  });
  return { ...detail, courseTitle: title, version: 2, assignedAt: "2026-11-02T09:00:00Z", unassignedAt: null };
}

test("pdfSafe swaps characters Helvetica can't draw", () => {
  assert.equal(pdfSafe("“Hi” it’s → done ✓\nnext"), '"Hi" it\'s -> done Yes next');
  assert.equal(pdfSafe("£90 – 10% off… €5"), "£90 – 10% off… €5");
  assert.equal(pdfSafe("emoji 🎉 gone"), "emoji  gone");
});

test("resultsFileName is a tidy slug", () => {
  assert.equal(resultsFileName("Jo O’Brien", "Keapr Bookings Hunter", "2026-11-13T14:00:00Z"), "keapr-training-results-jo-o-brien-keapr-bookings-hunter-2026-11-13.pdf");
  assert.equal(resultsFileName("Sam", null, "2026-11-13"), "keapr-training-results-sam-all-courses-2026-11-13.pdf");
});

test("buildResultsPdf makes a valid PDF for one or many courses", async () => {
  const one = await buildResultsPdf({ learnerName: "Sam Example", courses: [sampleCourse()], generatedAt: "2026-11-13T14:00:00Z" });
  assert.equal(Buffer.from(one.slice(0, 5)).toString(), "%PDF-");
  const many = await buildResultsPdf({ learnerName: "Sam Example", courses: Array.from({ length: 6 }, (_, i) => sampleCourse(`Course ${i + 1}`)), generatedAt: "2026-11-13T14:00:00Z" });
  assert.ok(many.length > one.length);
  const none = await buildResultsPdf({ learnerName: "Nobody", courses: [], generatedAt: "2026-11-13T14:00:00Z" });
  assert.equal(Buffer.from(none.slice(0, 5)).toString(), "%PDF-");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { sectionOf, sectionScores, withoutSectionTag } from "../lib/quiz-sections.ts";

test("reads the section tag at the end of an explanation", () => {
  assert.deepEqual(sectionOf("Two minutes to get the lead into Notion. (Section 2 — SPRINT overview and the clock)"), {
    number: 2,
    name: "SPRINT overview and the clock",
  });
  assert.deepEqual(sectionOf("Log first. (Section 3 — S: Store it)"), { number: 3, name: "S: Store it" });
  assert.equal(sectionOf("No tag here."), null);
  assert.equal(sectionOf(""), null);
});

test("strips the tag for display", () => {
  assert.equal(withoutSectionTag("Log first, then reply. (Section 3 — S: Store it)"), "Log first, then reply.");
  assert.equal(withoutSectionTag("Untagged."), "Untagged.");
});

test("scores each section in order", () => {
  const scores = sectionScores([
    { explanation: "a (Section 2 — Two)", isCorrect: false },
    { explanation: "b (Section 1 — One)", isCorrect: true },
    { explanation: "c (Section 1 — One)", isCorrect: true },
    { explanation: "d (Section 2 — Two)", isCorrect: true },
    { explanation: "e (Section 2 — Two)", isCorrect: true },
  ]);
  assert.deepEqual(scores, [
    { number: 1, name: "One", correct: 2, total: 2, percent: 100 },
    { number: 2, name: "Two", correct: 2, total: 3, percent: 66 },
  ]);
});

test("no breakdown for untagged, partly tagged or single-section quizzes", () => {
  assert.deepEqual(sectionScores([{ explanation: "x", isCorrect: true }]), []);
  assert.deepEqual(sectionScores([{ explanation: "x (Section 1 — One)", isCorrect: true }, { explanation: "y", isCorrect: true }]), []);
  assert.deepEqual(sectionScores([{ explanation: "x (Section 1 — One)", isCorrect: true }, { explanation: "y (Section 1 — One)", isCorrect: false }]), []);
});

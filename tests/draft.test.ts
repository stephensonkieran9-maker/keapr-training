import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanDraft, correctNeeded, emptyLesson, normaliseDraft, publishProblems, type CourseDraft } from "../lib/admin/draft.ts";

const readyLesson = () => ({
  ...emptyLesson(),
  title: "Lesson one",
  videoSeconds: 120,
  questions: [{ key: "q1", prompt: "Pick B", options: ["A", "B", "C"], correctIndex: 1, explanation: "" }],
});

test("an empty draft can't be published", () => {
  assert.deepEqual(publishProblems({ lessons: [] }), ["Add at least one lesson."]);
});

test("a complete lesson has no problems", () => {
  assert.deepEqual(publishProblems({ lessons: [readyLesson()] }), []);
});

test("missing title, video length and question text are all reported", () => {
  const l = { ...readyLesson(), title: " ", videoSeconds: 0 };
  l.questions = [{ ...l.questions[0], prompt: "" }];
  const p = publishProblems({ lessons: [l] });
  assert.ok(p.includes("Lesson 1 needs a title."));
  assert.ok(p.includes("Lesson 1 needs the video length."));
  assert.ok(p.includes("Lesson 1, question 1 needs the question text."));
});

test("blank answers are dropped and the correct answer still points at the same text", () => {
  const d: CourseDraft = { lessons: [{ ...readyLesson(), questions: [{ key: "q", prompt: "P", options: ["", "Right", "", "Wrong"], correctIndex: 1, explanation: "" }] }] };
  const q = cleanDraft(d).lessons[0].questions[0];
  assert.deepEqual(q.options, ["Right", "Wrong"]);
  assert.equal(q.correctIndex, 0);
});

test("marking a blank answer as correct is flagged", () => {
  const d: CourseDraft = { lessons: [{ ...readyLesson(), questions: [{ key: "q", prompt: "P", options: ["A", "B", ""], correctIndex: 2, explanation: "" }] }] };
  assert.ok(publishProblems(d).includes("Lesson 1, question 1 needs a correct answer marked."));
});

test("fewer than two answers is flagged", () => {
  const d: CourseDraft = { lessons: [{ ...readyLesson(), questions: [{ key: "q", prompt: "P", options: ["Only", "", ""], correctIndex: 0, explanation: "" }] }] };
  assert.ok(publishProblems(d).includes("Lesson 1, question 1 needs at least two answers."));
});

test("correct answers needed uses the exact ratio", () => {
  assert.equal(correctNeeded(5, 80), 4);
  assert.equal(correctNeeded(4, 80), 4); // 3/4 = 75% fails, so all 4 needed
  assert.equal(correctNeeded(3, 80), 3);
  assert.equal(correctNeeded(10, 80), 8);
  assert.equal(correctNeeded(6, 50), 3);
});

test("normalising junk produces a safe draft", () => {
  const d = normaliseDraft({ lessons: [{ title: 5, passPercent: 400, questions: [{ options: ["a"], correctIndex: 9 }] }] });
  assert.equal(d.lessons[0].title, "5");
  assert.equal(d.lessons[0].passPercent, 80);
  assert.equal(d.lessons[0].questions[0].correctIndex, 0);
  assert.deepEqual(normaliseDraft(null), { lessons: [] });
});

test("watch-only lessons publish without questions; quiz lessons still need one", async () => {
  const { publishProblems, cleanDraft, normaliseDraft, emptyLesson } = await import("../lib/admin/draft.ts");
  const watchOnly = { ...emptyLesson(), title: "Welcome", videoSeconds: 451, hasQuiz: false, requiredWatchPercent: 100 };
  assert.deepEqual(publishProblems({ lessons: [watchOnly] }), []);
  assert.equal(cleanDraft({ lessons: [watchOnly] }).lessons[0].questions.length, 0);
  const quiz = { ...emptyLesson(), title: "Quiz lesson", videoSeconds: 60, questions: [] };
  assert.ok(publishProblems({ lessons: [quiz] }).some((p) => p.includes("quiz question")));
  assert.equal(normaliseDraft({ lessons: [{ title: "Old" }] }).lessons[0].hasQuiz, true);
});

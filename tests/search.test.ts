import { test } from "node:test";
import assert from "node:assert/strict";
import { groupHits, normalise, search, snippetFor, staticItems, type SearchItem } from "../lib/search.ts";

const items: SearchItem[] = [
  { kind: "course", title: "Getting started with Keapr Training", href: "/courses/1", text: "How lessons, quizzes and your progress work." },
  { kind: "lesson", title: "Watching lessons and taking quizzes", subtitle: "Lesson 2 · Getting started", href: "/lessons/2", text: "Unlock a quiz by watching the lesson. Know the pass mark." },
  { kind: "lesson", title: "Retries, finishing a course", subtitle: "Locked · Lesson 3", href: "/lessons/3", text: "Know what happens if you don't pass.", locked: true },
  { kind: "person", title: "Zoë Café", subtitle: "zoe@keapr.co.uk", href: "/admin/staff/z" },
];

test("every word must match; title matches rank first", () => {
  const hits = search(items, "quiz");
  assert.deepEqual(hits.map((h) => h.href), ["/lessons/2", "/courses/1"]);
  assert.equal(search(items, "quiz zebra").length, 0);
});

test("matches inside extra text come with a snippet", () => {
  const [hit] = search(items, "pass mark");
  assert.equal(hit.href, "/lessons/2");
  assert.ok(hit.snippet?.toLowerCase().includes("pass mark"));
});

test("accents and case don't matter", () => {
  assert.equal(normalise("Zoë Café"), "zoe cafe");
  assert.equal(search(items, "ZOE cafe")[0].href, "/admin/staff/z");
  assert.equal(search(items, "keapr.co")[0].href, "/admin/staff/z");
});

test("empty query returns nothing; limit applies", () => {
  assert.equal(search(items, "   ").length, 0);
  assert.equal(search(items, "e", 2).length, 2);
});

test("groups follow display order", () => {
  const groups = groupHits(search(items, "lesson"));
  assert.deepEqual(groups.map((g) => g.kind), ["course", "lesson"]);
});

test("admin help and pages only for admins", () => {
  assert.ok(!staticItems(false).some((i) => i.href === "/admin/reports"));
  assert.ok(staticItems(true).some((i) => i.href === "/admin/reports"));
  assert.ok(search(staticItems(false), "padlock")[0].href.startsWith("/help#help-a-lesson-has-a-padlock"));
});

test("snippet trims long text around the match", () => {
  const s = snippetFor("a".repeat(200) + " target word " + "b".repeat(200), ["target"]);
  assert.ok(s!.startsWith("…") && s!.endsWith("…") && s!.includes("target"));
});

test("snippets start on a whole word", () => {
  const s = snippetFor("Lessons open in order. Pass the quiz for the lesson before it to unlock it.", ["quiz"], 40);
  assert.ok(/^…\w/.test(s!) && !s!.startsWith("…ssons"), s);
  const word = s!.slice(1).split(" ")[0];
  assert.ok("Lessons open in order. Pass the quiz for the lesson before it to unlock it.".split(" ").includes(word), word);
});

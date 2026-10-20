import { test } from "node:test";
import assert from "node:assert/strict";
import { noteLinks } from "../lib/note-links.ts";

const notes = "This video covers the first SPRINT step. Keep the board open while you watch.\n\nSPRINT – External Offers board in Notion:\nhttps://app.notion.com/p/312f?v=b2&source=copy_link";

test("label comes from the line above the link", () => {
  assert.deepEqual(noteLinks(notes), [{ label: "SPRINT – External Offers board in Notion", href: "https://app.notion.com/p/312f?v=b2&source=copy_link" }]);
});

test("label from text before the link on the same line; trailing punctuation dropped", () => {
  assert.deepEqual(noteLinks("Template: https://docs.example.com/t."), [{ label: "Template", href: "https://docs.example.com/t" }]);
});

test("falls back to the site name; no links means none", () => {
  const long = "x".repeat(100) + "\nhttps://www.example.com/a";
  assert.equal(noteLinks(long)[0].label, "example.com");
  assert.deepEqual(noteLinks("No links here."), []);
  assert.deepEqual(noteLinks(null), []);
});

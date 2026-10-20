import { test } from "node:test";
import assert from "node:assert/strict";
// Mirrors the split used by components/LinkedText.tsx.
const URL_RE = /(https?:\/\/[^\s<>"]+)/g;

test("web addresses are split out of notes, text around them kept", () => {
  const parts = "Open the board: https://app.notion.com/p/312f?v=b2&source=copy_link then log the lead.".split(URL_RE);
  assert.equal(parts.length, 3);
  assert.equal(parts[1], "https://app.notion.com/p/312f?v=b2&source=copy_link");
  assert.equal(parts[2], " then log the lead.");
});

test("non-web schemes are not linked", () => {
  assert.equal("javascript:alert(1) and ftp://x".split(URL_RE).length, 1);
});

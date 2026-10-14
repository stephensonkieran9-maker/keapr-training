import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeRanges, meetsWatchRequirement, watchedSeconds } from "../lib/video-ranges.ts";

test("overlapping and touching ranges merge", () => {
  assert.deepEqual(mergeRanges([[0, 10], [5, 20], [20.5, 30]], 100), [[0, 30]]);
});

test("rewatching the same part doesn't count twice", () => {
  const r = mergeRanges([[0, 30], [0, 30], [10, 20]], 100);
  assert.equal(watchedSeconds(r), 30);
});

test("skipping ahead only counts what played", () => {
  const r = mergeRanges([[0, 10], [90, 100]], 100);
  assert.equal(watchedSeconds(r), 20);
  assert.equal(meetsWatchRequirement(20, 100, 0.9), false);
});

test("ranges are clamped to the video length and junk is dropped", () => {
  const r = mergeRanges([[-5, 10], [95, 400], [Number.NaN, 3] as [number, number], [50, 40]], 100);
  assert.deepEqual(r, [[0, 10], [40, 50], [95, 100]]);
});

test("90% of a 120s video needs 108 unique seconds", () => {
  assert.equal(meetsWatchRequirement(107, 120, 0.9), false);
  assert.equal(meetsWatchRequirement(107.6, 120, 0.9), true);
  assert.equal(meetsWatchRequirement(0, 0, 0.9), false);
});

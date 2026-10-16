// Unique watched time, from ranges of the video that actually played.
// Pure: used by the player (client) and the save action (server), and tested.

export type Range = [number, number]; // [start, end] in seconds

/** Sorts, clamps to [0, duration] and merges overlapping or touching ranges. */
export function mergeRanges(ranges: Range[], duration: number, gap = 0.75): Range[] {
  const clean = ranges
    .filter((r) => Array.isArray(r) && r.length === 2 && Number.isFinite(r[0]) && Number.isFinite(r[1]))
    .map(([a, b]): Range => [Math.max(0, Math.min(a, b)), Math.min(duration, Math.max(a, b))])
    .filter(([a, b]) => b > a)
    .sort((x, y) => x[0] - y[0]);
  const out: Range[] = [];
  for (const r of clean) {
    const last = out[out.length - 1];
    if (last && r[0] <= last[1] + gap) last[1] = Math.max(last[1], r[1]);
    else out.push([r[0], r[1]]);
  }
  return out.map(([a, b]) => [round2(a), round2(b)]);
}

export function watchedSeconds(ranges: Range[]): number {
  return round2(ranges.reduce((n, [a, b]) => n + (b - a), 0));
}

/** True once the unique watched share reaches the lesson's requirement. */
export function meetsWatchRequirement(watched: number, duration: number, requiredRatio: number): boolean {
  if (duration <= 0) return false;
  // Half a second of rounding slack. "Watch it all" (99%+) gets a little more,
  // 1% of the video up to 3 seconds, so stored lengths rounded to the second
  // and the odd dropped frame can't leave someone stuck at 99.9%.
  const slack = requiredRatio >= 0.99 ? Math.max(0.5, Math.min(3, duration * 0.01)) : 0.5;
  return watched + slack >= duration * requiredRatio;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

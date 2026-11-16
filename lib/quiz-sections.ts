// Per-section scores for quizzes split into sections.
// A question belongs to a section when its explanation ends with
// "(Section 3 — S: Store it)". Quizzes without these tags show no breakdown.

export type SectionScore = { number: number; name: string; correct: number; total: number; percent: number };

const TAG = /\(Section\s+(\d+)\s*[—–-]\s*([^()]+)\)\s*$/;

export function sectionOf(explanation: string | null | undefined): { number: number; name: string } | null {
  const m = TAG.exec(explanation ?? "");
  return m ? { number: Number(m[1]), name: m[2].trim() } : null;
}

/** Explanation text without the trailing section tag. */
export function withoutSectionTag(explanation: string | null | undefined): string {
  return (explanation ?? "").replace(TAG, "").trim();
}

/** Scores per section, in section order. Empty unless every question is tagged and there are 2+ sections. */
export function sectionScores(results: { explanation?: string | null; isCorrect: boolean }[]): SectionScore[] {
  const byNumber = new Map<number, SectionScore>();
  for (const r of results) {
    const s = sectionOf(r.explanation);
    if (!s) return [];
    const row = byNumber.get(s.number) ?? { number: s.number, name: s.name, correct: 0, total: 0, percent: 0 };
    row.total += 1;
    if (r.isCorrect) row.correct += 1;
    byNumber.set(s.number, row);
  }
  if (byNumber.size < 2) return [];
  return [...byNumber.values()]
    .sort((a, b) => a.number - b.number)
    .map((row) => ({ ...row, percent: Math.floor((row.correct / row.total) * 100) }));
}

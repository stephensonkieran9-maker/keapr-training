// Marking a candidate's listing against an assessment's answer key, and
// ranking candidates. Pure functions: no database, no browser.

import {
  BED_TYPES, FIELDS, FIELD_BY_ID, SECTIONS, cleanValue, countBeds, displayValue,
  type AnswerValue, type Answers, type Beds, type FieldDef, type RoomsValue, type SectionId,
} from "./fields.ts";

/** One field's entry in an assessment's config. */
export interface FieldKey {
  /** Points the field is worth. 0 shows the field but doesn't mark it. */
  weight: number;
  /** The correct answer (not used for "text" fields, which use mustMention). */
  answer?: AnswerValue;
  /** Numbers: how far off still counts as correct (default 0). */
  tolerance?: number;
  /** Text fields: facts the candidate must mention. Each entry can list
   * alternatives separated by "|", e.g. "contractor|work crew". */
  mustMention?: string[];
}

export interface AssessmentConfig {
  fields: Record<string, FieldKey>;
}

export interface FieldScore {
  id: string;
  label: string;
  section: SectionId;
  weight: number;
  /** 0 to 1. */
  fraction: number;
  points: number;
  given: string;
  expected: string;
  note?: string;
}

export interface ScoreResult {
  fields: FieldScore[];
  points: number;
  maxPoints: number;
  /** 0 to 100, unrounded. */
  accuracy: number;
}

/** Fields shown to candidates, in catalogue order. */
export function formFieldIds(config: AssessmentConfig): string[] {
  return FIELDS.filter((f) => config.fields?.[f.id]).map((f) => f.id);
}

export function normaliseText(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normaliseWords(s: string): string {
  return ` ${s.toLowerCase().replace(/[£]/g, " £").replace(/[^a-z0-9£]+/g, " ").trim()} `;
}

/** Each mustMention entry, as alternatives in matchable form. */
export function mentionGroups(list: string[] | undefined): string[][] {
  return (list ?? [])
    .map((entry) => entry.split("|").map((a) => normaliseWords(a).trim()).filter(Boolean))
    .filter((alts) => alts.length > 0);
}

function sameBeds(a: Beds, b: Beds): boolean {
  return BED_TYPES.every((t) => (a[t.value] ?? 0) === (b[t.value] ?? 0));
}

function scoreRooms(given: RoomsValue, key: RoomsValue): { fraction: number; note: string } {
  const slots = Math.max(given.bedrooms.length, key.bedrooms.length);
  let right = 0;
  const wrong: string[] = [];
  for (let i = 0; i < slots; i++) {
    const g = given.bedrooms[i];
    const k = key.bedrooms[i];
    if (g && k && sameBeds(g, k)) right++;
    else wrong.push(`bedroom ${i + 1}`);
  }
  let total = slots;
  // Common spaces only count when either side has beds there, so an empty
  // living room isn't a free mark.
  if (countBeds(given.common) > 0 || countBeds(key.common) > 0) {
    total++;
    if (sameBeds(given.common, key.common)) right++;
    else wrong.push("common spaces");
  }
  if (total === 0) return { fraction: 1, note: "" };
  return { fraction: right / total, note: wrong.length ? `Wrong: ${wrong.join(", ")}` : "" };
}

function scoreField(f: FieldDef, key: FieldKey, raw: AnswerValue | undefined): { fraction: number; note?: string } {
  const given = cleanValue(f, raw ?? null);
  switch (f.type) {
    case "number": {
      const k = typeof key.answer === "number" ? key.answer : null;
      if (k === null) return { fraction: given === null ? 1 : 0 };
      // A blank box counts as 0 when the right answer is 0 (e.g. "no weekly discount").
      if (given === null) return { fraction: k === 0 ? 1 : 0 };
      const tol = Math.max(0, key.tolerance ?? 0);
      // Small epsilon so 0.1 + 0.2 style float noise never fails a match.
      return { fraction: Math.abs((given as number) - k) <= tol + 1e-9 ? 1 : 0 };
    }
    case "select":
    case "time":
    case "yesno":
      return { fraction: given !== "" && given === key.answer ? 1 : 0 };
    case "shorttext": {
      const g = normaliseText(String(given));
      if (!g) return { fraction: 0 };
      const alts = String(key.answer ?? "").split("|").map(normaliseText).filter(Boolean);
      return { fraction: alts.includes(g) ? 1 : 0 };
    }
    case "text": {
      const text = normaliseWords(String(given));
      if (!text.trim()) return { fraction: 0, note: "Left blank" };
      const groups = mentionGroups(key.mustMention);
      if (groups.length === 0) return { fraction: 1 };
      const missing: string[] = [];
      let found = 0;
      for (const alts of groups) {
        if (alts.some((a) => text.includes(` ${a} `))) found++;
        else missing.push(alts[0]);
      }
      return { fraction: found / groups.length, note: missing.length ? `Didn't mention: ${missing.join(", ")}` : undefined };
    }
    case "multi": {
      const g = new Set(given as string[]);
      const k = new Set(Array.isArray(key.answer) ? (key.answer as string[]) : []);
      if (g.size === 0 && k.size === 0) return { fraction: 1 };
      const both = [...g].filter((x) => k.has(x)).length;
      const union = new Set([...g, ...k]).size;
      const missed = [...k].filter((x) => !g.has(x)).map((x) => label(f, x));
      const extra = [...g].filter((x) => !k.has(x)).map((x) => label(f, x));
      const notes = [missed.length ? `Missed: ${missed.join(", ")}` : "", extra.length ? `Shouldn't be ticked: ${extra.join(", ")}` : ""].filter(Boolean);
      return { fraction: both / union, note: notes.join(". ") || undefined };
    }
    case "rooms": {
      const k = cleanValue(f, key.answer ?? null) as RoomsValue;
      return scoreRooms(given as RoomsValue, k);
    }
  }
}

function label(f: FieldDef, value: string) {
  return f.options?.find((o) => o.value === value)?.label.replace(/\s*\(.*\)$/, "") ?? value;
}

function expectedText(f: FieldDef, key: FieldKey): string {
  if (f.type === "text") {
    const groups = mentionGroups(key.mustMention);
    return groups.length ? `Mentions: ${(key.mustMention ?? []).map((m) => m.split("|")[0].trim()).join(", ")}` : "Any answer";
  }
  if (f.type === "shorttext") return String(key.answer ?? "").split("|")[0];
  const v = displayValue(f, key.answer ?? null);
  return f.type === "number" && key.tolerance ? `${v} (± ${key.tolerance})` : v;
}

/** Marks a set of answers. Accuracy is points earned ÷ points available. */
export function scoreAnswers(config: AssessmentConfig, answers: Answers): ScoreResult {
  const fields: FieldScore[] = [];
  for (const id of formFieldIds(config)) {
    const f = FIELD_BY_ID[id];
    const key = config.fields[id];
    const weight = Math.max(0, Number(key.weight) || 0);
    if (weight === 0) continue;
    const { fraction, note } = scoreField(f, key, answers[id]);
    fields.push({
      id, label: f.label, section: f.section, weight, fraction,
      points: weight * fraction,
      given: displayValue(f, cleanValue(f, answers[id] ?? null)),
      expected: expectedText(f, key),
      note,
    });
  }
  const points = fields.reduce((n, x) => n + x.points, 0);
  const maxPoints = fields.reduce((n, x) => n + x.weight, 0);
  return { fields, points, maxPoints, accuracy: maxPoints === 0 ? 0 : (points / maxPoints) * 100 };
}

// ─────────────────────────────────────────────────────────────
// Checking an answer key before it's used
// ─────────────────────────────────────────────────────────────

/** Problems that would make marking unfair or broken. Empty = good to go. */
export function configProblems(config: AssessmentConfig): string[] {
  const p: string[] = [];
  const entries = Object.entries(config.fields ?? {});
  if (entries.length === 0) p.push("Turn on at least one field.");
  for (const [id, key] of entries) {
    const f = FIELD_BY_ID[id];
    if (!f) { p.push(`Unknown field "${id}".`); continue; }
    const w = Number(key.weight);
    if (!Number.isFinite(w) || w < 0 || w > 100) { p.push(`${f.label}: weight must be between 0 and 100.`); continue; }
    if (w === 0) continue;
    if (f.type === "text") {
      if (mentionGroups(key.mustMention).length === 0) p.push(`${f.label}: add at least one fact it must mention, or set its weight to 0.`);
      continue;
    }
    const clean = cleanValue(f, key.answer ?? null);
    const blank = clean === null || clean === "" || (f.type === "rooms" && (clean as RoomsValue).bedrooms.length === 0 && countBeds((clean as RoomsValue).common) === 0);
    if (blank && f.type !== "multi") p.push(`${f.label}: set the correct answer.`);
    if (f.type === "multi" && Array.isArray(key.answer) && (clean as string[]).length !== key.answer.length) p.push(`${f.label}: the answer contains options that don't exist.`);
    if (key.tolerance !== undefined && (!Number.isFinite(Number(key.tolerance)) || Number(key.tolerance) < 0)) p.push(`${f.label}: tolerance can't be negative.`);
  }
  if (entries.length > 0 && entries.every(([, k]) => !(Number(k.weight) > 0))) p.push("At least one field needs a weight above 0.");
  return p;
}

/** Normalises a config from the editor or database into a safe shape. */
export function cleanConfig(raw: unknown): AssessmentConfig {
  const src = ((raw && typeof raw === "object" ? (raw as { fields?: unknown }).fields : null) ?? {}) as Record<string, unknown>;
  const fields: Record<string, FieldKey> = {};
  for (const f of FIELDS) {
    const k = src[f.id] as Partial<FieldKey> | undefined;
    if (!k || typeof k !== "object") continue;
    const entry: FieldKey = { weight: Math.max(0, Math.min(100, Number(k.weight) || 0)) };
    if (f.type === "text") {
      entry.mustMention = Array.isArray(k.mustMention) ? k.mustMention.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 30) : [];
    } else if (f.type === "shorttext") {
      entry.answer = typeof k.answer === "string" ? k.answer.slice(0, 200) : "";
    } else {
      entry.answer = cleanValue(f, k.answer ?? null);
    }
    if (f.type === "number" && k.tolerance !== undefined && Number(k.tolerance) > 0) entry.tolerance = Number(k.tolerance);
    fields[f.id] = entry;
  }
  return { fields };
}

/** Sections that have at least one field turned on, in order. */
export function sectionsFor(fieldIds: string[]) {
  const on = new Set(fieldIds.map((id) => FIELD_BY_ID[id]?.section));
  return SECTIONS.filter((s) => on.has(s.id));
}

// ─────────────────────────────────────────────────────────────
// Ranking and export
// ─────────────────────────────────────────────────────────────

export type CandidateStatus = "registered" | "in_progress" | "submitted" | "timed_out";

export interface CandidateRow {
  candidateId: string;
  name: string;
  email: string;
  phone: string | null;
  registeredAt: string;
  status: CandidateStatus;
  startedAt: string | null;
  submittedAt: string | null;
  accuracy: number | null;
  timeTakenSeconds: number | null;
}

export const STATUS_LABEL: Record<CandidateStatus, string> = {
  registered: "Registered, not started",
  in_progress: "In progress",
  submitted: "Submitted",
  timed_out: "Time ran out",
};

/** Accuracy first (highest), then speed (fastest). Finished attempts come
 * first; then in-progress; then people who haven't started. */
export function rankCandidates(rows: CandidateRow[]): CandidateRow[] {
  const done = (r: CandidateRow) => r.accuracy !== null;
  const stage = (r: CandidateRow) => (done(r) ? 0 : r.status === "in_progress" ? 1 : 2);
  return [...rows].sort((a, b) => {
    if (stage(a) !== stage(b)) return stage(a) - stage(b);
    if (done(a) && done(b)) {
      // Compare at 0.01% so float noise never decides a tie.
      const acc = Math.round(b.accuracy! * 100) - Math.round(a.accuracy! * 100);
      if (acc !== 0) return acc;
      const t = (a.timeTakenSeconds ?? Infinity) - (b.timeTakenSeconds ?? Infinity);
      if (t !== 0) return t;
    }
    return a.registeredAt.localeCompare(b.registeredAt);
  });
}

function csvCell(v: string | number | null): string {
  if (v === null) return "";
  let s = String(v);
  // Stop spreadsheet apps treating a name like "=SUM()" as a formula.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function formatMinutesSeconds(seconds: number | null): string {
  if (seconds === null) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function candidatesCsv(rows: CandidateRow[]): string {
  const head = ["Rank", "Name", "Email", "Phone", "Status", "Accuracy %", "Time taken (m:ss)", "Time taken (seconds)", "Registered", "Started", "Submitted"];
  const ranked = rankCandidates(rows);
  let rank = 0;
  const lines = ranked.map((r) => {
    if (r.accuracy !== null) rank++;
    return [
      r.accuracy !== null ? rank : null, r.name, r.email, r.phone, STATUS_LABEL[r.status],
      r.accuracy !== null ? r.accuracy.toFixed(1) : null,
      formatMinutesSeconds(r.timeTakenSeconds), r.timeTakenSeconds,
      r.registeredAt, r.startedAt, r.submittedAt,
    ].map(csvCell).join(",");
  });
  return [head.join(","), ...lines].join("\r\n") + "\r\n";
}

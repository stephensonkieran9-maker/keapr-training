// Marking a candidate's listing against an assessment's answer key, and
// ranking candidates. Pure functions: no database, no browser.

import {
  BED_TYPES, FIELDS, FIELD_BY_ID, PHOTO_CATEGORIES, SECTIONS, cleanValue, countBeds, displayValue, isPhotoHash,
  type AnswerValue, type Answers, type Beds, type FieldDef, type PhotoCategory, type RoomsValue, type SectionId,
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
  /** Optional working, shown next to the answer in results. */
  explanation?: string;
  /** Text fields: extra points for writing it as real prose in the
   * candidate's own words (not bullet points, not copied from the brief). */
  qualityWeight?: number;
}

/** An admin's manual adjustment to one field's mark. */
export interface FieldOverride {
  points: number;
  reason: string;
  by: string;
  at: string;
}
export type Overrides = Record<string, FieldOverride>;

/** What marking can compare against (the brief the candidate saw). */
export interface ScoreContext {
  source?: string;
}

/** A property photo uploaded by an admin. The hash identifies the exact
 * file, so a candidate's re-uploaded copy can be matched to it. */
export interface PhotoKey {
  id: string;
  path: string;
  hash: string;
  category: PhotoCategory;
  name: string;
}

export interface AssessmentConfig {
  fields: Record<string, FieldKey>;
  /** Kept outside `fields` so turning the photos field off and on again
   * doesn't lose them. */
  photos?: PhotoKey[];
}

export const PHOTO_ORDER: PhotoCategory[] = PHOTO_CATEGORIES.map((c) => c.value);
const categoryLabel = (c: PhotoCategory) => PHOTO_CATEGORIES.find((x) => x.value === c)?.label.replace(/\s*\(.*\)$/, "").toLowerCase() ?? c;

/** Photos: every photo uploaded, in category order. Score = share of the
 * right photos uploaded × share of photo pairs in the right order. */
export function scorePhotos(given: string[], photos: PhotoKey[]): { fraction: number; note?: string } {
  if (photos.length === 0) return { fraction: 1 };
  const byHash = new Map(photos.map((p) => [p.hash, p]));
  const matched = given.filter((h) => byHash.has(h));
  const unknown = given.length - matched.length;
  if (matched.length === 0) return { fraction: 0, note: given.length ? "None of the uploads were the property photos" : "No photos uploaded" };
  const coverage = matched.length / Math.max(photos.length, given.length);
  const ranks = matched.map((h) => PHOTO_ORDER.indexOf(byHash.get(h)!.category));
  let pairs = 0;
  let good = 0;
  for (let i = 0; i < ranks.length; i++) {
    for (let j = i + 1; j < ranks.length; j++) {
      if (ranks[i] === ranks[j]) continue;
      pairs++;
      if (ranks[i] < ranks[j]) good++;
    }
  }
  const order = pairs === 0 ? 1 : good / pairs;
  const notes: string[] = [];
  const missing = photos.length - matched.length;
  if (missing > 0) notes.push(`${missing} photo${missing === 1 ? "" : "s"} missing`);
  if (unknown > 0) notes.push(`${unknown} upload${unknown === 1 ? " wasn't a property photo" : "s weren't property photos"}`);
  let maxSoFar = -1;
  for (const r of ranks) {
    if (r < maxSoFar) {
      notes.push(`Out of order: a ${categoryLabel(PHOTO_ORDER[r])} photo comes after a ${categoryLabel(PHOTO_ORDER[maxSoFar])} photo`);
      break;
    }
    maxSoFar = Math.max(maxSoFar, r);
  }
  return { fraction: coverage * order, note: notes.join(". ") || undefined };
}

export interface FieldScore {
  /** Automatic mark before any admin adjustment. */
  autoPoints?: number;
  override?: FieldOverride;
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
  overrides?: Overrides;
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

function scoreField(f: FieldDef, key: FieldKey, raw: AnswerValue | undefined, config: AssessmentConfig): { fraction: number; note?: string } {
  const given = cleanValue(f, raw ?? null);
  switch (f.type) {
    case "photos":
      return scorePhotos(given as string[], config.photos ?? []);
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

function expectedText(f: FieldDef, key: FieldKey, config: AssessmentConfig): string {
  if (f.type === "photos") {
    const n = config.photos?.length ?? 0;
    return `All ${n} photos: living spaces, dining, kitchen, bedrooms, bathrooms, then anything else`;
  }
  if (f.type === "text") {
    const groups = mentionGroups(key.mustMention);
    return groups.length ? `Mentions: ${(key.mustMention ?? []).map((m) => m.split("|")[0].trim()).join(", ")}` : "Any answer";
  }
  if (f.type === "shorttext") return String(key.answer ?? "").split("|")[0];
  const v = displayValue(f, key.answer ?? null);
  const shown = f.type === "number" && key.tolerance ? `${v} (± ${key.tolerance})` : v;
  return key.explanation ? `${shown}. ${key.explanation}` : shown;
}

/** Marks a set of answers. Accuracy is points earned ÷ points available. */
export function scoreAnswers(config: AssessmentConfig, answers: Answers, ctx: ScoreContext = {}, overrides: Overrides = {}): ScoreResult {
  const fields: FieldScore[] = [];
  for (const id of formFieldIds(config)) {
    const f = FIELD_BY_ID[id];
    const key = config.fields[id];
    const contentWeight = Math.max(0, Number(key.weight) || 0);
    const qualityWeight = f.type === "text" ? Math.max(0, Number(key.qualityWeight) || 0) : 0;
    const weight = contentWeight + qualityWeight;
    if (weight === 0) continue;
    const { fraction: contentFraction, note } = scoreField(f, key, answers[id], config);
    let points = contentWeight * contentFraction;
    const notes = [note];
    if (qualityWeight > 0) {
      const q = writingQuality(String(cleanValue(f, answers[id] ?? null)), ctx.source ?? "");
      points += qualityWeight * q.fraction;
      notes.push(`Writing: ${(qualityWeight * q.fraction).toFixed(1)} of ${qualityWeight} (${q.note})`);
    }
    const base: FieldScore = {
      id, label: f.label, section: f.section, weight, fraction: points / weight, points,
      given: displayValue(f, cleanValue(f, answers[id] ?? null)),
      expected: expectedText(f, key, config) + (qualityWeight > 0 ? `. Plus ${qualityWeight} points for writing it as a real description in their own words` : ""),
      note: notes.filter(Boolean).join(". ") || undefined,
    };
    const o = overrides[id];
    if (o) {
      const p = Math.max(0, Math.min(weight, Number(o.points) || 0));
      fields.push({ ...base, autoPoints: base.points, points: p, fraction: p / weight, override: o });
    } else {
      fields.push(base);
    }
  }
  const points = fields.reduce((n, x) => n + x.points, 0);
  const maxPoints = fields.reduce((n, x) => n + x.weight, 0);
  const result: ScoreResult = { fields, points, maxPoints, accuracy: maxPoints === 0 ? 0 : (points / maxPoints) * 100 };
  if (Object.keys(overrides).length) result.overrides = overrides;
  return result;
}

// ─────────────────────────────────────────────────────────────
// Writing quality: prose, not a list; own words, not the brief's
// ─────────────────────────────────────────────────────────────

const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9£]+/g, " ").trim().split(" ").filter(Boolean);

/** Share of the text that sits inside runs of 6+ words copied word for
 * word from the source. Short keywords ("free Wi-Fi") never count. */
export function copiedShare(text: string, source: string, run = 6): number {
  const w = words(text);
  const src = words(source);
  if (w.length < run || src.length < run) return 0;
  const grams = new Set<string>();
  for (let i = 0; i + run <= src.length; i++) grams.add(src.slice(i, i + run).join(" "));
  const covered = new Array<boolean>(w.length).fill(false);
  for (let i = 0; i + run <= w.length; i++) {
    if (grams.has(w.slice(i, i + run).join(" "))) for (let j = i; j < i + run; j++) covered[j] = true;
  }
  return covered.filter(Boolean).length / w.length;
}

/** 0 to 1, half for reading as prose, half for being in their own words. */
export function writingQuality(text: string, source: string): { fraction: number; note: string } {
  const all = words(text);
  if (all.length < 30) return { fraction: 0, note: all.length ? "too short to judge" : "left blank" };
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const listy = lines.filter((l) => /^([-*•·▪–]|\d+[.)])\s*/.test(l) || words(l).length < 6).length;
  const listShare = lines.length <= 2 ? 0 : listy / lines.length;
  const sentences = (text.match(/[.!?](\s|$)/g) ?? []).length;
  let prose = 1 - listShare;
  if (sentences < 2) prose = Math.min(prose, 0.5);
  const copied = copiedShare(text, source);
  // Up to 25% copied is fine; nothing for this half at 75% or more.
  const own = copied <= 0.25 ? 1 : copied >= 0.75 ? 0 : 1 - (copied - 0.25) / 0.5;
  const fraction = 0.5 * prose + 0.5 * own;
  const bits = [
    listShare > 0.3 ? `${Math.round(listShare * 100)}% list-style lines` : sentences < 2 ? "not written in sentences" : "reads as prose",
    `${Math.round(copied * 100)}% copied word for word from the brief`,
  ];
  return { fraction, note: bits.join(", ") };
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
    if (f.type === "photos") {
      if (!config.photos?.length) p.push(`${f.label}: upload the property photos on the Photos tab, or set its weight to 0.`);
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
    if (f.type === "photos") {
      // nothing to store: the photos themselves live in config.photos
    } else if (f.type === "text") {
      entry.mustMention = Array.isArray(k.mustMention) ? k.mustMention.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 30) : [];
    } else if (f.type === "shorttext") {
      entry.answer = typeof k.answer === "string" ? k.answer.slice(0, 200) : "";
    } else {
      entry.answer = cleanValue(f, k.answer ?? null);
    }
    if (f.type === "number" && k.tolerance !== undefined && Number(k.tolerance) > 0) entry.tolerance = Number(k.tolerance);
    if (typeof k.explanation === "string" && k.explanation.trim()) entry.explanation = k.explanation.trim().slice(0, 500);
    if (f.type === "text" && Number(k.qualityWeight) > 0) entry.qualityWeight = Math.min(100, Number(k.qualityWeight));
    fields[f.id] = entry;
  }
  const rawPhotos = (raw && typeof raw === "object" ? (raw as { photos?: unknown }).photos : null);
  const photos: PhotoKey[] = (Array.isArray(rawPhotos) ? rawPhotos : [])
    .filter((p): p is PhotoKey => Boolean(p) && typeof p === "object" && isPhotoHash((p as PhotoKey).hash) && typeof (p as PhotoKey).path === "string")
    .map((p) => ({
      id: String(p.id), path: p.path, hash: p.hash, name: String(p.name ?? "").slice(0, 200),
      category: (PHOTO_ORDER.includes(p.category) ? p.category : "other") as PhotoCategory,
    }))
    .slice(0, 60);
  return photos.length ? { fields, photos } : { fields };
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

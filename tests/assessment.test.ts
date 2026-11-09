import { test } from "node:test";
import assert from "node:assert/strict";
import { FIELD_BY_ID, cleanAnswers, cleanValue, type Answers } from "../lib/assessment/fields.ts";
import {
  candidatesCsv, cleanConfig, configProblems, formFieldIds, rankCandidates, scoreAnswers,
  type AssessmentConfig, type CandidateRow,
} from "../lib/assessment/scoring.ts";
import { SAMPLE_CONFIG } from "../lib/assessment/sample.ts";

/** A perfect set of answers, built from the key itself. */
function perfect(config: AssessmentConfig): Answers {
  const a: Answers = {};
  for (const [id, k] of Object.entries(config.fields)) {
    if (FIELD_BY_ID[id].type === "text") a[id] = (k.mustMention ?? []).map((m) => m.split("|")[0]).join(", ");
    else if (k.answer !== undefined) a[id] = k.answer;
  }
  return a;
}

test("the sample answer key has no problems", () => {
  assert.deepEqual(configProblems(SAMPLE_CONFIG), []);
  assert.deepEqual(cleanConfig(SAMPLE_CONFIG), SAMPLE_CONFIG);
});

test("perfect answers score 100%; a blank form only gets the 'no discount' zeros", () => {
  assert.equal(scoreAnswers(SAMPLE_CONFIG, perfect(SAMPLE_CONFIG)).accuracy, 100);
  assert.equal(scoreAnswers(SAMPLE_CONFIG, {}).points, 2); // weekly and monthly discount are 0
});

test("a blank discount box counts as 0, but a blank price doesn't", () => {
  const a = perfect(SAMPLE_CONFIG);
  delete a.weeklyDiscount;
  delete a.baseRate;
  const byId = Object.fromEntries(scoreAnswers(SAMPLE_CONFIG, a).fields.map((f) => [f.id, f]));
  assert.equal(byId.weeklyDiscount.fraction, 1);
  assert.equal(byId.baseRate.fraction, 0);
});

test("falling for the case study's traps loses the right marks", () => {
  const a = perfect(SAMPLE_CONFIG);
  a.baseRate = 110;                 // the owner's first ask
  a.cleaningFee = 55;               // the cleaner's cost
  a.rooms = { bedrooms: [{ king: 1 }, { double: 1 }, { single: 1 }], common: { sofa: 1 } }; // old bedroom 2
  const r = scoreAnswers(SAMPLE_CONFIG, a);
  const byId = Object.fromEntries(r.fields.map((f) => [f.id, f]));
  assert.equal(byId.baseRate.fraction, 0);
  assert.equal(byId.cleaningFee.fraction, 0);
  assert.equal(byId.rooms.fraction, 3 / 4);
  assert.match(byId.rooms.note!, /bedroom 2/);
  assert.equal(r.maxPoints - r.points, 1 + 1 + 0.5);
});

test("amenities score by overlap, so ticking everything isn't rewarded", () => {
  const f = FIELD_BY_ID.amenities;
  const all = f.options!.map((o) => o.value);
  const a = { ...perfect(SAMPLE_CONFIG), amenities: all };
  const s = scoreAnswers(SAMPLE_CONFIG, a).fields.find((x) => x.id === "amenities")!;
  const keyed = (SAMPLE_CONFIG.fields.amenities.answer as string[]).length;
  assert.equal(s.fraction, keyed / all.length);
  assert.match(s.note!, /Shouldn't be ticked: .*Tumble dryer/);
});

test("contractor quote allows the set tolerance", () => {
  const q = (v: number) => scoreAnswers(SAMPLE_CONFIG, { ...perfect(SAMPLE_CONFIG), contractorQuote: v }).fields.find((x) => x.id === "contractorQuote")!.fraction;
  assert.equal(q(2730), 1);
  assert.equal(q(2730.8), 1);
  assert.equal(q(2731.5), 0);
  assert.equal(q(2660), 0); // forgot the cleaning fee
  assert.equal(q(2464), 0); // applied the 90-night discount to 28 nights
});

test("address matching ignores case, spaces and punctuation", () => {
  const s = (postcode: string) => scoreAnswers(SAMPLE_CONFIG, { ...perfect(SAMPLE_CONFIG), postcode }).fields.find((x) => x.id === "postcode")!.fraction;
  assert.equal(s("ip39qx"), 1);
  assert.equal(s(" IP3  9QX "), 1);
  assert.equal(s("IP3 9QZ"), 0);
});

test("text fields score by facts mentioned", () => {
  const t = (title: string) => scoreAnswers(SAMPLE_CONFIG, { ...perfect(SAMPLE_CONFIG), title }).fields.find((x) => x.id === "title")!;
  assert.equal(t("Three-bed house in Ipswich for contractors").fraction, 1);
  const half = t("Lovely 3 bed home in Ipswich");
  assert.equal(half.fraction, 2 / 3);
  assert.match(half.note!, /contractor/);
  assert.equal(t("").fraction, 0);
  // Whole words only: "bedside" doesn't count as "bed".
  assert.equal(t("Ipswichy 3 bedside").fraction, 0);
});

test("weight 0 fields are shown but not marked", () => {
  assert.ok(formFieldIds(SAMPLE_CONFIG).includes("checkInUntil"));
  assert.ok(!scoreAnswers(SAMPLE_CONFIG, {}).fields.some((f) => f.id === "checkInUntil"));
});

test("answers from the browser are cleaned to their field types", () => {
  const ids = formFieldIds(SAMPLE_CONFIG);
  const clean = cleanAnswers(ids, {
    baseRate: "£95", maxGuests: 999, propertyType: "castle", amenities: ["wi_fi", "jacuzzi", "wi_fi"],
    title: "x".repeat(80), rooms: { bedrooms: [{ king: "1", spaceship: 2 }], common: null }, hacked: true,
    smokingAllowed: "maybe",
  });
  assert.equal(clean.baseRate, 95);
  assert.equal(clean.maxGuests, 30);
  assert.equal(clean.propertyType, "");
  assert.deepEqual(clean.amenities, ["wi_fi"]);
  assert.equal((clean.title as string).length, 50);
  assert.deepEqual(clean.rooms, { bedrooms: [{ king: 1 }], common: {} });
  assert.equal(clean.smokingAllowed, "");
  assert.ok(!("hacked" in clean));
  assert.equal(cleanValue(FIELD_BY_ID.bathrooms, "1.5"), 1.5);
});

test("configProblems catches unusable keys", () => {
  const p = configProblems({ fields: { baseRate: { weight: 1 }, title: { weight: 2, mustMention: [] }, amenities: { weight: 1, answer: ["wi_fi", "moat"] }, nope: { weight: 1 } } });
  assert.ok(p.includes("Base nightly rate: set the correct answer."));
  assert.ok(p.some((x) => x.startsWith("Listing title: add at least one fact")));
  assert.ok(p.includes("Amenities: the answer contains options that don't exist."));
  assert.ok(p.includes('Unknown field "nope".'));
  assert.deepEqual(configProblems({ fields: {} }), ["Turn on at least one field."]);
});

const row = (over: Partial<CandidateRow>): CandidateRow => ({
  candidateId: "c", name: "N", email: "n@x.com", phone: null, registeredAt: "2026-11-09T09:00:00Z",
  status: "submitted", startedAt: "2026-11-09T09:01:00Z", submittedAt: "2026-11-09T09:40:00Z",
  accuracy: 80, timeTakenSeconds: 2340, ...over,
});

test("ranking: accuracy first, then speed, then unfinished", () => {
  const ranked = rankCandidates([
    row({ candidateId: "slow80", accuracy: 80, timeTakenSeconds: 3000 }),
    row({ candidateId: "notstarted", status: "registered", accuracy: null, timeTakenSeconds: null }),
    row({ candidateId: "fast80", accuracy: 80.0004, timeTakenSeconds: 1500 }),
    row({ candidateId: "best", accuracy: 95, timeTakenSeconds: 3500 }),
    row({ candidateId: "going", status: "in_progress", accuracy: null, timeTakenSeconds: null }),
  ]);
  assert.deepEqual(ranked.map((r) => r.candidateId), ["best", "fast80", "slow80", "going", "notstarted"]);
});

test("CSV ranks finished candidates and defuses formulas", () => {
  const csv = candidatesCsv([row({ name: "=HYPERLINK(1)", accuracy: 91.25 }), row({ name: "Waiting", status: "registered", accuracy: null, timeTakenSeconds: null })]);
  const lines = csv.trim().split("\r\n");
  assert.equal(lines.length, 3);
  assert.match(lines[1], /^1,'=HYPERLINK\(1\),n@x.com,,Submitted,91.3,39:00,2340,/);
  assert.match(lines[2], /^,Waiting,/);
});

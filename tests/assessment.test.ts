import { test } from "node:test";
import assert from "node:assert/strict";
import { FIELD_BY_ID, cleanAnswers, cleanValue, type Answers } from "../lib/assessment/fields.ts";
import {
  candidatesCsv, cleanConfig, configProblems, formFieldIds, rankCandidates, scoreAnswers, scorePhotos,
  type AssessmentConfig, type CandidateRow, type PhotoKey,
} from "../lib/assessment/scoring.ts";
import { SAMPLE_CONFIG } from "../lib/assessment/sample.ts";

/** A perfect set of answers, built from the key itself. */
function perfect(config: AssessmentConfig): Answers {
  const a: Answers = { photos: RIGHT_ORDER };
  for (const [id, k] of Object.entries(config.fields)) {
    // Text answers as proper sentences, so writing-quality marks are full too.
    if (FIELD_BY_ID[id].type === "text") a[id] = (k.mustMention ?? []).map((m) => `It offers ${m.split("|")[0]}.`).join(" ");
    else if (typeof k.answer === "string" && FIELD_BY_ID[id].type === "shorttext") a[id] = k.answer.split("|")[0];
    else if (k.answer !== undefined) a[id] = k.answer;
  }
  return a;
}

const h = (n: number) => n.toString(16).padStart(64, "0");
const PHOTOS: PhotoKey[] = [
  { id: "a", path: "x/a.jpg", hash: h(1), category: "bedroom", name: "bed1.jpg" },
  { id: "b", path: "x/b.jpg", hash: h(2), category: "living", name: "lounge.jpg" },
  { id: "c", path: "x/c.jpg", hash: h(3), category: "kitchen", name: "kitchen.jpg" },
  { id: "d", path: "x/d.jpg", hash: h(4), category: "other", name: "garden.jpg" },
  { id: "e", path: "x/e.jpg", hash: h(5), category: "bathroom", name: "bath.jpg" },
  { id: "f", path: "x/f.jpg", hash: h(6), category: "dining", name: "dining.jpg" },
];
const RIGHT_ORDER = [h(2), h(6), h(3), h(1), h(5), h(4)];
const WITH_PHOTOS: AssessmentConfig = { ...SAMPLE_CONFIG, photos: PHOTOS };

test("the sample needs photos before it can open, then has no problems", () => {
  assert.deepEqual(configProblems(SAMPLE_CONFIG), ["Listing photos: upload the property photos on the Photos tab, or set its weight to 0."]);
  assert.deepEqual(configProblems(WITH_PHOTOS), []);
  assert.deepEqual(cleanConfig(SAMPLE_CONFIG), SAMPLE_CONFIG);
  assert.deepEqual(cleanConfig(WITH_PHOTOS), WITH_PHOTOS);
});

test("photos: all of them in category order scores full marks", () => {
  assert.equal(scorePhotos(RIGHT_ORDER, PHOTOS).fraction, 1);
  // Same-category photos can go in any order between themselves.
  const twoBeds = [...PHOTOS, { id: "g", path: "x/g.jpg", hash: h(7), category: "bedroom" as const, name: "bed2.jpg" }];
  assert.equal(scorePhotos([h(2), h(6), h(3), h(7), h(1), h(5), h(4)], twoBeds).fraction, 1);
});

test("photos: missing, unknown and out-of-order photos lose marks", () => {
  const missing = scorePhotos(RIGHT_ORDER.slice(0, 3), PHOTOS);
  assert.equal(missing.fraction, 0.5);
  assert.match(missing.note!, /3 photos missing/);
  const extra = scorePhotos([...RIGHT_ORDER, h(99), h(98)], PHOTOS);
  assert.equal(extra.fraction, 6 / 8);
  assert.match(extra.note!, /2 uploads weren't property photos/);
  // Kitchen and living swapped: 1 of 15 pairs wrong.
  const swapped = scorePhotos([h(3), h(6), h(2), h(1), h(5), h(4)], PHOTOS);
  assert.ok(swapped.fraction < 1 && swapped.fraction > 0.7);
  assert.match(swapped.note!, /Out of order: a dining photo comes after a kitchen photo/);
  assert.equal(scorePhotos([...RIGHT_ORDER].reverse(), PHOTOS).fraction, 0);
  assert.equal(scorePhotos([], PHOTOS).fraction, 0);
});

test("perfect answers score 100%; a blank form only gets the 'no discount' zeros", () => {
  assert.equal(scoreAnswers(WITH_PHOTOS, perfect(WITH_PHOTOS)).accuracy, 100);
  assert.equal(scoreAnswers(WITH_PHOTOS, {}).points, 2); // weekly and monthly discount are 0
});

test("a blank discount box counts as 0, but a blank price doesn't", () => {
  const a = perfect(WITH_PHOTOS);
  delete a.weeklyDiscount;
  delete a.baseRate;
  const byId = Object.fromEntries(scoreAnswers(WITH_PHOTOS, a).fields.map((f) => [f.id, f]));
  assert.equal(byId.weeklyDiscount.fraction, 1);
  assert.equal(byId.baseRate.fraction, 0);
});

test("common mistakes lose the right marks", () => {
  const a = perfect(WITH_PHOTOS);
  a.monthlyDiscount = 10;           // applied the 90-night discount to 28+ nights
  a.parking = "free_parking_on_premises"; // it's street parking
  a.rooms = { bedrooms: [{ king: 1 }, { double: 1 }, { single: 1 }], common: {} }; // only one single
  const r = scoreAnswers(WITH_PHOTOS, a);
  const byId = Object.fromEntries(r.fields.map((f) => [f.id, f]));
  assert.equal(byId.monthlyDiscount.fraction, 0);
  assert.equal(byId.parking.fraction, 0);
  assert.equal(byId.rooms.fraction, 2 / 3);
  assert.match(byId.rooms.note!, /bedroom 3/);
  assert.ok(Math.abs(r.maxPoints - r.points - (1 + 1 + 2 / 3)) < 1e-9);
});

test("amenities score by overlap, so ticking everything isn't rewarded", () => {
  const f = FIELD_BY_ID.amenities;
  const all = f.options!.map((o) => o.value);
  const a = { ...perfect(WITH_PHOTOS), amenities: all };
  const s = scoreAnswers(WITH_PHOTOS, a).fields.find((x) => x.id === "amenities")!;
  const keyed = (SAMPLE_CONFIG.fields.amenities.answer as string[]).length;
  assert.equal(s.fraction, keyed / all.length);
  assert.match(s.note!, /Shouldn't be ticked: .*Tumble dryer/);
});

test("contractor quote allows the set tolerance", () => {
  const q = (v: number) => scoreAnswers(WITH_PHOTOS, { ...perfect(WITH_PHOTOS), contractorQuote: v }).fields.find((x) => x.id === "contractorQuote")!.fraction;
  assert.equal(q(3560), 1);
  assert.equal(q(3560.8), 1);
  assert.equal(q(3561.5), 0);
  assert.equal(q(3500), 0); // forgot the cleaning fee
  assert.equal(q(3210), 0); // applied the 90-night discount to 28 nights
  assert.equal(q(3860), 0); // added the deposit
});

test("address matching ignores case, spaces and punctuation", () => {
  const s = (postcode: string) => scoreAnswers(WITH_PHOTOS, { ...perfect(WITH_PHOTOS), postcode }).fields.find((x) => x.id === "postcode")!.fraction;
  assert.equal(s("st50qt"), 1);
  assert.equal(s(" ST5  0QT "), 1);
  assert.equal(s("ST5 0QX"), 0);
});

test("text fields score by facts mentioned", () => {
  const t = (title: string) => scoreAnswers(WITH_PHOTOS, { ...perfect(WITH_PHOTOS), title }).fields.find((x) => x.id === "title")!;
  assert.equal(t("Spacious 3-Bedroom House with Garden and Free Wi-Fi in Newcastle-under-Lyme").fraction, 1);
  assert.equal(t("Three bedroom home with parking, Newcastle").fraction, 1);
  const nameOnly = t("The Hollies House");
  assert.equal(nameOnly.fraction, 0.25); // only "house"
  assert.match(nameOnly.note!, /3 bed, garden, newcastle/);
  assert.equal(t("").fraction, 0);
  // Whole words only: "bedside" doesn't count as "bed".
  assert.equal(t("Newcastles 3 bedside").fraction, 0);
  // Several facts: marked as a share.
  const n = (neighbourhood: string) => scoreAnswers(WITH_PHOTOS, { ...perfect(WITH_PHOTOS), neighbourhood }).fields.find((x) => x.id === "neighbourhood")!.fraction;
  assert.equal(n("Close to the town centre and the bus station."), 2 / 3);
});

test("weight 0 fields are shown but not marked", () => {
  const cfg = { ...WITH_PHOTOS, fields: { ...WITH_PHOTOS.fields, checkInUntil: { weight: 0, answer: "" } } };
  assert.ok(formFieldIds(cfg).includes("checkInUntil"));
  assert.ok(!scoreAnswers(cfg, {}).fields.some((f) => f.id === "checkInUntil"));
});

test("answers from the browser are cleaned to their field types", () => {
  const ids = formFieldIds(SAMPLE_CONFIG);
  const clean = cleanAnswers(ids, {
    baseRate: "£95", maxGuests: 999, propertyType: "castle", amenities: ["wi_fi", "jacuzzi", "wi_fi"],
    title: "x".repeat(80), rooms: { bedrooms: [{ king: "1", spaceship: 2 }], common: null }, hacked: true,
    smokingAllowed: "maybe", photos: [h(1), "not-a-hash", h(1), 5],
  });
  assert.equal(clean.baseRate, 95);
  assert.equal(clean.maxGuests, 30);
  assert.equal(clean.propertyType, "");
  assert.deepEqual(clean.amenities, ["wi_fi"]);
  assert.equal((clean.title as string).length, 80); // under the 100 limit, kept whole
  assert.deepEqual(clean.rooms, { bedrooms: [{ king: 1 }], common: {} });
  assert.equal(clean.smokingAllowed, "");
  assert.deepEqual(clean.photos, [h(1)]);
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

import { copiedShare, writingQuality } from "../lib/assessment/scoring.ts";
import { SAMPLE_CASE_STUDY } from "../lib/assessment/sample.ts";

test("copying: only runs of 6+ words count, not keywords", () => {
  const own = "A bright three-bedroom house in Newcastle-under-Lyme with a private garden, free Wi-Fi and room for six guests. Perfect for contractors on longer projects, with a fully equipped kitchen and two bathrooms.";
  assert.equal(copiedShare(own, SAMPLE_CASE_STUDY), 0);
  const pasted = "Smoking is strictly prohibited inside the property. Parties, gatherings and events are not permitted.";
  assert.ok(copiedShare(pasted, SAMPLE_CASE_STUDY) > 0.9);
});

test("writing quality: prose in own words scores full, pasted bullets don't", () => {
  const prose = "Welcome to The Hollies House, a spacious three-bedroom house in Newcastle-under-Lyme that sleeps six. It has two bathrooms, a fully equipped kitchen, free Wi-Fi and a private garden. It suits contractors, families and long-term guests, with free street parking and easy self check-in. Brampton Park is a short walk away.";
  assert.equal(writingQuality(prose, SAMPLE_CASE_STUDY).fraction, 1);
  const bullets = SAMPLE_CASE_STUDY.split("## Amenities and facilities")[1].split("## Nearby")[0];
  const q = writingQuality(bullets, SAMPLE_CASE_STUDY);
  assert.ok(q.fraction < 0.4, `pasted bullets scored ${q.fraction}`);
  assert.equal(writingQuality("Nice house.", SAMPLE_CASE_STUDY).fraction, 0); // too short
});

test("description: 9 points for facts plus 3 for writing, and admin overrides apply", () => {
  const prose = "Welcome to The Hollies House, a spacious three-bedroom house in Newcastle-under-Lyme that sleeps six. It has two bathrooms, a fully equipped kitchen, free Wi-Fi and a private garden. It suits contractors, families and long-term guests, with free street parking and easy self check-in. Brampton Park is a short walk away, and smoking isn't allowed inside.";
  const r = scoreAnswers(WITH_PHOTOS, { ...perfect(WITH_PHOTOS), description: prose }, { source: SAMPLE_CASE_STUDY });
  const d = r.fields.find((f) => f.id === "description")!;
  assert.equal(d.weight, 12);
  assert.equal(d.points, 12);
  const o = scoreAnswers(WITH_PHOTOS, { ...perfect(WITH_PHOTOS), description: prose }, { source: SAMPLE_CASE_STUDY },
    { description: { points: 8, reason: "bland", by: "Admin", at: "2026-11-11T10:00:00Z" } });
  const od = o.fields.find((f) => f.id === "description")!;
  assert.equal(od.points, 8);
  assert.equal(od.autoPoints, 12);
  assert.equal(o.maxPoints - o.points, 4);
  assert.ok(o.overrides?.description);
});

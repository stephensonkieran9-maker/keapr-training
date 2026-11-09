// The listing builder's field catalogue, shared by the candidate form, the
// answer-key editor and the marking code. Safe for both server and browser:
// it holds field definitions only, never answers.
//
// An assessment's config picks which of these fields appear (and how much
// each is worth). Adding a brand-new field means adding it here; turning
// existing fields on or off is done per assessment in the admin screens.

export type SectionId = "basics" | "listing" | "rooms" | "amenities" | "pricing" | "policies" | "rules";

export const SECTIONS: { id: SectionId; label: string; blurb: string }[] = [
  { id: "basics", label: "Property basics", blurb: "What kind of place it is, where it is and who it's for." },
  { id: "listing", label: "Title & description", blurb: "What guests read first." },
  { id: "rooms", label: "Rooms & beds", blurb: "Capacity and the bed layout, room by room." },
  { id: "amenities", label: "Amenities", blurb: "Tick everything the property actually offers. Nothing more." },
  { id: "pricing", label: "Pricing", blurb: "Nightly rate, fees and length-of-stay discounts. All prices in £." },
  { id: "policies", label: "Availability & policies", blurb: "Stay lengths, arrival and departure, cancellation." },
  { id: "rules", label: "House rules", blurb: "What guests can and can't do." },
];

export type FieldType = "select" | "multi" | "number" | "yesno" | "time" | "shorttext" | "text" | "rooms";

export interface Option { value: string; label: string; group?: string }

export interface FieldDef {
  id: string;
  section: SectionId;
  label: string;
  type: FieldType;
  hint?: string;
  options?: Option[];
  /** number fields */
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  stepper?: boolean;     // show − / + buttons (counts)
  /** text fields */
  maxLength?: number;
  multiline?: boolean;
  placeholder?: string;
}

export const BED_TYPES = [
  { value: "king", label: "King bed" },
  { value: "double", label: "Double bed" },
  { value: "single", label: "Single / twin bed" },
  { value: "sofa", label: "Sofa bed" },
  { value: "bunk", label: "Bunk bed" },
  { value: "cot", label: "Cot" },
] as const;
export type BedType = (typeof BED_TYPES)[number]["value"];
export type Beds = Partial<Record<BedType, number>>;
export interface RoomsValue { bedrooms: Beds[]; common: Beds }

export type AnswerValue = string | number | string[] | RoomsValue | null;
export type Answers = Record<string, AnswerValue>;

const opts = (...labels: string[]): Option[] => labels.map((l) => ({ value: slug(l), label: l }));
function slug(s: string) {
  return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export const TIME_OPTIONS: Option[] = [
  { value: "flexible", label: "Flexible" },
  ...Array.from({ length: 48 }, (_, i) => {
    const h = String(Math.floor(i / 2)).padStart(2, "0");
    const m = i % 2 ? "30" : "00";
    return { value: `${h}:${m}`, label: `${h}:${m}` };
  }),
];

const g = (group: string, ...labels: string[]): Option[] => labels.map((l) => ({ value: slug(l.replace(/\s*\(.*\)$/, "")), label: l, group }));

export const AMENITIES: Option[] = [
  ...g("Essentials", "Wi-Fi", "TV", "Central heating", "Air conditioning", "Hot water", "Essentials (towels, bed linen, soap, toilet roll)", "Hair dryer", "Iron", "Hangers"),
  ...g("Kitchen & dining", "Kitchen", "Fridge", "Freezer", "Oven", "Hob", "Microwave", "Dishwasher", "Kettle", "Coffee maker", "Toaster", "Cooking basics (pots, pans, oil, salt and pepper)", "Dishes and cutlery", "Dining table"),
  ...g("Laundry", "Washing machine", "Tumble dryer", "Clothes drying rack"),
  ...g("Work & travel", "Dedicated workspace", "EV charger", "Luggage drop-off allowed", "Long-term stays allowed"),
  ...g("Entertainment", "Streaming services", "Books and reading material"),
  ...g("Outdoor", "Private garden", "Patio or balcony", "BBQ grill", "Outdoor furniture"),
  ...g("Family", "Cot", "High chair"),
  ...g("Safety", "Smoke alarm", "Carbon monoxide alarm", "Fire extinguisher", "First aid kit", "Exterior security cameras"),
  ...g("Access", "Private entrance", "Step-free access"),
];

export const FIELDS: FieldDef[] = [
  // Property basics
  { id: "propertyType", section: "basics", label: "Property type", type: "select", options: opts("House", "Flat / apartment", "Bungalow", "Townhouse", "Cottage", "Studio", "Guest suite") },
  { id: "placeType", section: "basics", label: "What guests will have", type: "select", options: [
    { value: "entire", label: "An entire place" }, { value: "private_room", label: "A private room" }, { value: "shared_room", label: "A shared room" },
  ] },
  { id: "street", section: "basics", label: "Street address", type: "shorttext", placeholder: "House number and street", maxLength: 80 },
  { id: "city", section: "basics", label: "Town / city", type: "shorttext", maxLength: 60 },
  { id: "postcode", section: "basics", label: "Postcode", type: "shorttext", maxLength: 10 },
  { id: "targetGuests", section: "basics", label: "Target guests", type: "multi", hint: "Who the listing is aimed at. Tick all that apply.", options: opts(
    "Contractors and work crews", "Relocations", "Insurance placements", "Business travellers", "Families", "Holidaymakers", "Students",
  ) },

  // Title & description
  { id: "title", section: "listing", label: "Listing title", type: "text", maxLength: 50, hint: "Short and specific. 50 characters maximum." },
  { id: "description", section: "listing", label: "Listing description", type: "text", multiline: true, maxLength: 500, hint: "500 characters maximum." },

  // Rooms & beds
  { id: "maxGuests", section: "rooms", label: "Maximum guests", type: "number", min: 1, max: 30, step: 1, stepper: true },
  { id: "bedrooms", section: "rooms", label: "Bedrooms", type: "number", min: 0, max: 20, step: 1, stepper: true },
  { id: "beds", section: "rooms", label: "Beds (total)", type: "number", min: 0, max: 40, step: 1, stepper: true, hint: "Every bed, sofa bed and cot counts." },
  { id: "bathrooms", section: "rooms", label: "Bathrooms", type: "number", min: 0, max: 20, step: 0.5, stepper: true, hint: "A toilet and basin with no bath or shower counts as 0.5." },
  { id: "rooms", section: "rooms", label: "Bed layout", type: "rooms", hint: "Add each bedroom in the order the case study numbers them. Beds outside bedrooms go under Common spaces." },

  // Amenities
  { id: "amenities", section: "amenities", label: "Amenities", type: "multi", options: AMENITIES },
  { id: "parking", section: "amenities", label: "Parking", type: "select", options: opts(
    "Free parking on premises", "Free on-street parking", "Paid parking on premises", "Paid parking off premises", "No parking",
  ) },
  { id: "parkingSpaces", section: "amenities", label: "Parking spaces for guests", type: "number", min: 0, max: 20, step: 1, stepper: true },
  { id: "wifiSpeed", section: "amenities", label: "Wi-Fi download speed", type: "number", min: 0, max: 10000, step: 1, suffix: "Mbps" },

  // Pricing
  { id: "baseRate", section: "pricing", label: "Base nightly rate", type: "number", prefix: "£", min: 0, max: 10000, step: 0.01 },
  { id: "cleaningFee", section: "pricing", label: "Cleaning fee (per stay)", type: "number", prefix: "£", min: 0, max: 5000, step: 0.01 },
  { id: "extraGuestFee", section: "pricing", label: "Extra guest fee (per guest, per night)", type: "number", prefix: "£", min: 0, max: 1000, step: 0.01 },
  { id: "extraGuestFrom", section: "pricing", label: "Extra guest fee applies after", type: "number", suffix: "guests", min: 0, max: 30, step: 1, stepper: true },
  { id: "securityDeposit", section: "pricing", label: "Security deposit (refundable)", type: "number", prefix: "£", min: 0, max: 10000, step: 0.01 },
  { id: "weeklyDiscount", section: "pricing", label: "Weekly discount (7+ nights)", type: "number", suffix: "%", min: 0, max: 99, step: 1, hint: "Enter 0 if there isn't one." },
  { id: "monthlyDiscount", section: "pricing", label: "Monthly discount (28+ nights)", type: "number", suffix: "%", min: 0, max: 99, step: 1, hint: "Enter 0 if there isn't one." },
  { id: "longStayDiscount", section: "pricing", label: "Long-stay discount (90+ nights)", type: "number", suffix: "%", min: 0, max: 99, step: 1, hint: "Enter 0 if there isn't one." },
  { id: "contractorQuote", section: "pricing", label: "Example contractor quote: total for a 4-week (28-night) stay", type: "number", prefix: "£", min: 0, max: 1000000, step: 0.01, hint: "Work this out from the rates and any discount that applies. Include the cleaning fee but not the refundable deposit." },

  // Availability & policies
  { id: "minNights", section: "policies", label: "Minimum stay", type: "number", suffix: "nights", min: 1, max: 365, step: 1, stepper: true },
  { id: "maxNights", section: "policies", label: "Maximum stay", type: "number", suffix: "nights", min: 1, max: 1125, step: 1 },
  { id: "advanceNotice", section: "policies", label: "Advance notice", type: "select", options: [
    { value: "same_day", label: "Same day" }, { value: "1_day", label: "At least 1 day" }, { value: "2_days", label: "At least 2 days" },
    { value: "3_days", label: "At least 3 days" }, { value: "7_days", label: "At least 7 days" },
  ] },
  { id: "checkInFrom", section: "policies", label: "Check-in from", type: "time" },
  { id: "checkInUntil", section: "policies", label: "Check-in until", type: "time" },
  { id: "checkOut", section: "policies", label: "Check-out by", type: "time" },
  { id: "checkInMethod", section: "policies", label: "Self check-in method", type: "select", options: opts(
    "Smart lock", "Keypad", "Lockbox", "Building staff", "Host greets guests",
  ) },
  { id: "cancellation", section: "policies", label: "Cancellation policy", type: "select", options: opts(
    "Flexible", "Moderate", "Firm", "Strict", "Non-refundable",
  ) },

  // House rules
  { id: "petsAllowed", section: "rules", label: "Pets allowed", type: "yesno" },
  { id: "smokingAllowed", section: "rules", label: "Smoking or vaping allowed", type: "yesno" },
  { id: "eventsAllowed", section: "rules", label: "Parties and events allowed", type: "yesno" },
  { id: "childrenAllowed", section: "rules", label: "Suitable for children (2–12)", type: "yesno" },
  { id: "quietFrom", section: "rules", label: "Quiet hours start", type: "time" },
  { id: "quietUntil", section: "rules", label: "Quiet hours end", type: "time" },
  { id: "additionalRules", section: "rules", label: "Additional rules", type: "text", multiline: true, maxLength: 500 },
];

export const FIELD_BY_ID: Record<string, FieldDef> = Object.fromEntries(FIELDS.map((f) => [f.id, f]));

export function emptyRooms(): RoomsValue {
  return { bedrooms: [], common: {} };
}

export function emptyValue(f: FieldDef): AnswerValue {
  if (f.type === "multi") return [];
  if (f.type === "rooms") return emptyRooms();
  if (f.type === "number") return null;
  return "";
}

/** Total beds in a room (or a whole layout). */
export function countBeds(b: Beds): number {
  return BED_TYPES.reduce((n, t) => n + (b[t.value] ?? 0), 0);
}

/** Has this field been filled in at all? Used for section progress. */
export function isAnswered(f: FieldDef, v: AnswerValue | undefined): boolean {
  if (v === undefined || v === null) return false;
  if (f.type === "multi") return Array.isArray(v) && v.length > 0;
  if (f.type === "rooms") {
    const r = v as RoomsValue;
    return r.bedrooms.length > 0 || countBeds(r.common) > 0;
  }
  if (typeof v === "string") return v.trim().length > 0;
  return typeof v === "number" && Number.isFinite(v);
}

function clampNumber(n: unknown, f: FieldDef): number | null {
  if (n === null || n === undefined || n === "") return null;
  const v = typeof n === "number" ? n : Number(String(n).replace(/[£,%\s]/g, ""));
  if (!Number.isFinite(v)) return null;
  const min = f.min ?? -1e9;
  const max = f.max ?? 1e9;
  return Math.min(max, Math.max(min, Math.round(v * 100) / 100));
}

function cleanBeds(x: unknown): Beds {
  const out: Beds = {};
  if (!x || typeof x !== "object") return out;
  for (const t of BED_TYPES) {
    const n = Number((x as Record<string, unknown>)[t.value]);
    if (Number.isFinite(n) && n > 0) out[t.value] = Math.min(10, Math.floor(n));
  }
  return out;
}

/** Coerces one value to its field's type, dropping anything that doesn't fit.
 * Used on everything that arrives from a browser. */
export function cleanValue(f: FieldDef, raw: unknown): AnswerValue {
  switch (f.type) {
    case "number":
      return clampNumber(raw, f);
    case "select":
    case "time": {
      const s = typeof raw === "string" ? raw : "";
      const list = f.type === "time" ? TIME_OPTIONS : f.options ?? [];
      return list.some((o) => o.value === s) ? s : "";
    }
    case "yesno":
      return raw === "yes" || raw === "no" ? raw : "";
    case "multi": {
      const allowed = new Set((f.options ?? []).map((o) => o.value));
      const arr = Array.isArray(raw) ? raw : [];
      return [...new Set(arr.filter((x): x is string => typeof x === "string" && allowed.has(x)))];
    }
    case "shorttext":
    case "text": {
      const s = typeof raw === "string" ? raw.replace(/\r\n/g, "\n") : "";
      return s.slice(0, f.maxLength ?? 2000);
    }
    case "rooms": {
      const r = (raw && typeof raw === "object" ? raw : {}) as { bedrooms?: unknown; common?: unknown };
      const bedrooms = Array.isArray(r.bedrooms) ? r.bedrooms.slice(0, 20).map(cleanBeds) : [];
      return { bedrooms, common: cleanBeds(r.common) };
    }
  }
}

/** Keeps only the given fields, each cleaned. */
export function cleanAnswers(fieldIds: string[], raw: unknown): Answers {
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Answers = {};
  for (const id of fieldIds) {
    const f = FIELD_BY_ID[id];
    if (f && id in src) out[id] = cleanValue(f, src[id]);
  }
  return out;
}

/** Plain-text version of an answer for tables and CSVs. */
export function displayValue(f: FieldDef, v: AnswerValue | undefined): string {
  if (v === undefined || v === null || v === "") return "";
  switch (f.type) {
    case "select":
      return f.options?.find((o) => o.value === v)?.label ?? String(v);
    case "time":
      return v === "flexible" ? "Flexible" : String(v);
    case "yesno":
      return v === "yes" ? "Yes" : "No";
    case "multi":
      return (v as string[]).map((x) => f.options?.find((o) => o.value === x)?.label.replace(/\s*\(.*\)$/, "") ?? x).join(", ");
    case "number":
      return `${f.prefix ?? ""}${v}${f.suffix ? (f.suffix === "%" ? "%" : ` ${f.suffix}`) : ""}`;
    case "rooms": {
      const r = v as RoomsValue;
      const beds = (b: Beds) => BED_TYPES.filter((t) => b[t.value]).map((t) => `${b[t.value]} × ${t.label.toLowerCase()}`).join(", ") || "no beds";
      const parts = r.bedrooms.map((b, i) => `Bedroom ${i + 1}: ${beds(b)}`);
      if (countBeds(r.common) > 0) parts.push(`Common spaces: ${beds(r.common)}`);
      return parts.join("; ");
    }
    default:
      return String(v);
  }
}

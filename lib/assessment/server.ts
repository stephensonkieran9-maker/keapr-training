import "server-only";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanAnswers, type Answers } from "./fields";
import { cleanConfig, formFieldIds, scoreAnswers, type AssessmentConfig, type PhotoKey } from "./scoring";

// Candidates for listing assessments. They are not Supabase Auth users: the
// server keeps its own small account and session tables (migration 0018),
// and every read and write goes through the service role. Nothing about an
// assessment's answer key ever reaches the browser.

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const COOKIE = "kt_candidate";
const SESSION_DAYS = 7;
/** Submissions a little after the deadline still count (slow networks). */
export const GRACE_SECONDS = 30;

export interface PublicAssessment {
  id: string;
  slug: string;
  title: string;
  intro: string;
  timeLimitMinutes: number;
  isOpen: boolean;
}

export interface Candidate {
  id: string;
  assessmentId: string;
  fullName: string;
  email: string;
}

export interface AttemptState {
  id: string;
  startedAt: string;
  deadlineAt: string;
  submittedAt: string | null;
  submitKind: "candidate" | "timeout" | null;
  answers: Answers;
  savedAt: string | null;
  caseStudy: string;
  fieldIds: string[];
  /** Photos from the snapshot (server use: includes categories). */
  photos: PhotoKey[];
}

const db = () => createAdminClient();

export function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [kind, saltB64, hashB64] = stored.split("$");
  if (kind !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function getAssessmentBySlug(slug: string): Promise<PublicAssessment | null> {
  if (!/^[a-z0-9-]{6,64}$/.test(slug)) return null;
  const { data } = await db()
    .from("assessments")
    .select("id, slug, title, intro, time_limit_minutes, is_open, archived_at")
    .eq("slug", slug)
    .maybeSingle();
  if (!data || data.archived_at) return null;
  return { id: data.id, slug: data.slug, title: data.title, intro: data.intro, timeLimitMinutes: data.time_limit_minutes, isOpen: data.is_open };
}

async function startSession(candidateId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const { error } = await db().from("assessment_sessions").insert({ token_hash: sha256(token), candidate_id: candidateId, expires_at: expires.toISOString() });
  if (error) throw new Error(`Couldn't start your session: ${error.message}`);
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/assess", expires });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await db().from("assessment_sessions").delete().eq("token_hash", sha256(token));
  store.delete({ name: COOKIE, path: "/assess" });
}

/** The signed-in candidate for this assessment, if any. */
export async function currentCandidate(assessmentId: string): Promise<Candidate | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const { data } = await db()
    .from("assessment_sessions")
    .select("expires_at, assessment_candidates!inner(id, assessment_id, full_name, email)")
    .eq("token_hash", sha256(token))
    .maybeSingle();
  if (!data || new Date(data.expires_at) < new Date()) return null;
  const c = data.assessment_candidates as unknown as { id: string; assessment_id: string; full_name: string; email: string };
  if (c.assessment_id !== assessmentId) return null;
  return { id: c.id, assessmentId: c.assessment_id, fullName: c.full_name, email: c.email };
}

export type AuthResult = { ok: true } | { ok: false; error: string };

export async function registerCandidate(a: PublicAssessment, input: { fullName: string; email: string; phone: string; password: string }): Promise<AuthResult> {
  if (!a.isOpen) return { ok: false, error: "This assessment isn't taking new candidates at the moment." };
  const fullName = input.fullName.trim().slice(0, 120);
  const email = normaliseEmail(input.email).slice(0, 200);
  const phone = input.phone.trim().slice(0, 40) || null;
  if (!fullName) return { ok: false, error: "Enter your full name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (input.password.length < 8) return { ok: false, error: "Choose a password of at least 8 characters." };
  if (input.password.length > 200) return { ok: false, error: "That password is too long." };

  const { data, error } = await db()
    .from("assessment_candidates")
    .insert({ assessment_id: a.id, full_name: fullName, email, phone, password_hash: await hashPassword(input.password) })
    .select("id")
    .single();
  if (error?.code === "23505") return { ok: false, error: "That email is already registered for this assessment. Sign in instead." };
  if (error || !data) return { ok: false, error: "Something went wrong registering you. Please try again." };
  await startSession(data.id);
  return { ok: true };
}

export async function signInCandidate(a: PublicAssessment, email: string, password: string): Promise<AuthResult> {
  const { data } = await db()
    .from("assessment_candidates")
    .select("id, password_hash")
    .eq("assessment_id", a.id)
    .eq("email", normaliseEmail(email))
    .maybeSingle();
  // Same message either way, so the form doesn't reveal who has registered.
  const bad = { ok: false as const, error: "That email and password don't match a registration for this assessment." };
  if (!data) {
    await hashPassword(password); // similar timing whether or not the email exists
    return bad;
  }
  if (!(await verifyPassword(password, data.password_hash))) return bad;
  await db().from("assessment_sessions").delete().lt("expires_at", new Date().toISOString());
  await startSession(data.id);
  return { ok: true };
}

export type AttemptRow = {
  id: string; started_at: string; deadline_at: string; submitted_at: string | null; submit_kind: "candidate" | "timeout" | null;
  answers: unknown; saved_at: string | null; case_study_snapshot: string; config_snapshot: unknown;
};
const ATTEMPT_COLS = "id, started_at, deadline_at, submitted_at, submit_kind, answers, saved_at, case_study_snapshot, config_snapshot";

function toState(r: AttemptRow): AttemptState {
  const config = cleanConfig(r.config_snapshot);
  const fieldIds = formFieldIds(config);
  return {
    id: r.id, startedAt: r.started_at, deadlineAt: r.deadline_at, submittedAt: r.submitted_at, submitKind: r.submit_kind,
    answers: cleanAnswers(fieldIds, r.answers), savedAt: r.saved_at, caseStudy: r.case_study_snapshot, fieldIds,
    photos: config.photos ?? [],
  };
}

function pastGrace(deadlineAt: string, now = Date.now()) {
  return now > new Date(deadlineAt).getTime() + GRACE_SECONDS * 1000;
}

/** Marks and closes an attempt. Only the first call wins; later calls (a
 * second tab, a retry, the timeout sweep) change nothing. */
async function finalise(row: AttemptRow, answers: Answers, kind: "candidate" | "timeout") {
  const config = cleanConfig(row.config_snapshot);
  const result = scoreAnswers(config, answers, { source: row.case_study_snapshot });
  const started = new Date(row.started_at).getTime();
  const deadline = new Date(row.deadline_at).getTime();
  const end = Math.min(Date.now(), deadline);
  const { data } = await db()
    .from("assessment_attempts")
    .update({
      answers,
      submitted_at: new Date(end).toISOString(),
      submit_kind: kind,
      score: result,
      accuracy: Math.round(result.accuracy * 1000) / 1000,
      time_taken_seconds: Math.max(0, Math.round((end - started) / 1000)),
    })
    .eq("id", row.id)
    .is("submitted_at", null)
    .select(ATTEMPT_COLS)
    .maybeSingle();
  return data as AttemptRow | null;
}

/** Closes any attempts whose time (plus grace) has run out, using their last
 * autosave. Runs whenever a candidate or an admin loads a page. */
export async function finaliseExpired(filter: { assessmentId?: string; candidateId?: string }) {
  let q = db().from("assessment_attempts").select(ATTEMPT_COLS).is("submitted_at", null)
    .lt("deadline_at", new Date(Date.now() - GRACE_SECONDS * 1000).toISOString());
  if (filter.assessmentId) q = q.eq("assessment_id", filter.assessmentId);
  if (filter.candidateId) q = q.eq("candidate_id", filter.candidateId);
  const { data } = await q;
  for (const row of (data ?? []) as AttemptRow[]) {
    const config = cleanConfig(row.config_snapshot);
    await finalise(row, cleanAnswers(formFieldIds(config), row.answers), "timeout");
  }
}

/** The raw attempt row (server use only: it includes the answer key). */
export async function attemptRowForCandidate(candidateId: string): Promise<AttemptRow | null> {
  await finaliseExpired({ candidateId });
  const { data } = await db().from("assessment_attempts").select(ATTEMPT_COLS).eq("candidate_id", candidateId).maybeSingle();
  return (data as AttemptRow | null) ?? null;
}

export async function getAttempt(candidateId: string): Promise<AttemptState | null> {
  await finaliseExpired({ candidateId });
  const { data } = await db().from("assessment_attempts").select(ATTEMPT_COLS).eq("candidate_id", candidateId).maybeSingle();
  return data ? toState(data as AttemptRow) : null;
}

/** Starts the timer. Starting twice (double click, two tabs) returns the
 * same attempt: the unique candidate_id stops a second one. */
export async function startAttempt(a: PublicAssessment, candidate: Candidate): Promise<AttemptState | { error: string }> {
  const existing = await getAttempt(candidate.id);
  if (existing) return existing;
  if (!a.isOpen) return { error: "This assessment has been closed, so it can't be started now." };

  const { data: full } = await db().from("assessments").select("case_study, config, time_limit_minutes").eq("id", a.id).single();
  if (!full) return { error: "This assessment couldn't be loaded." };
  const config: AssessmentConfig = cleanConfig(full.config);
  if (formFieldIds(config).length === 0) return { error: "This assessment isn't set up yet. Please contact the person who sent you the link." };

  const now = new Date();
  const { error } = await db().from("assessment_attempts").insert({
    candidate_id: candidate.id,
    assessment_id: a.id,
    started_at: now.toISOString(),
    deadline_at: new Date(now.getTime() + full.time_limit_minutes * 60_000).toISOString(),
    case_study_snapshot: full.case_study,
    config_snapshot: config,
  });
  if (error && error.code !== "23505") return { error: "The test couldn't be started. Please try again." };
  return (await getAttempt(candidate.id)) ?? { error: "The test couldn't be started. Please try again." };
}

export type SaveResult = { ok: true; savedAt: string } | { ok: false; reason: "submitted" | "expired" | "missing" };

export async function saveAnswers(candidateId: string, raw: unknown): Promise<SaveResult> {
  const { data } = await db().from("assessment_attempts").select(ATTEMPT_COLS).eq("candidate_id", candidateId).maybeSingle();
  if (!data) return { ok: false, reason: "missing" };
  const row = data as AttemptRow;
  if (row.submitted_at) return { ok: false, reason: "submitted" };
  if (pastGrace(row.deadline_at)) {
    await finaliseExpired({ candidateId });
    return { ok: false, reason: "expired" };
  }
  const answers = cleanAnswers(formFieldIds(cleanConfig(row.config_snapshot)), raw);
  const savedAt = new Date().toISOString();
  const { data: updated } = await db().from("assessment_attempts").update({ answers, saved_at: savedAt })
    .eq("id", row.id).is("submitted_at", null).select("id").maybeSingle();
  return updated ? { ok: true, savedAt } : { ok: false, reason: "submitted" };
}

/** Final submission. After the deadline (plus grace) the posted answers are
 * ignored and the last autosave is marked instead. */
export async function submitAnswers(candidateId: string, raw: unknown, kind: "candidate" | "timeout"): Promise<{ ok: boolean }> {
  const { data } = await db().from("assessment_attempts").select(ATTEMPT_COLS).eq("candidate_id", candidateId).maybeSingle();
  if (!data) return { ok: false };
  const row = data as AttemptRow;
  if (row.submitted_at) return { ok: true };
  const fieldIds = formFieldIds(cleanConfig(row.config_snapshot));
  const late = pastGrace(row.deadline_at);
  const answers = cleanAnswers(fieldIds, late ? row.answers : raw);
  const timedOut = kind === "timeout" || Date.now() >= new Date(row.deadline_at).getTime();
  await finalise(row, answers, timedOut ? "timeout" : "candidate");
  return { ok: true };
}

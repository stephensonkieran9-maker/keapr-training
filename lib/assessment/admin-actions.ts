"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PHOTO_CATEGORIES, cleanAnswers, type PhotoCategory } from "./fields";
import { PHOTO_BUCKET, sha256Hex } from "./photos";
import { SAMPLE_CASE_STUDY, SAMPLE_CONFIG, SAMPLE_INTRO, SAMPLE_TITLE } from "./sample";
import { cleanConfig, configProblems, formFieldIds, scoreAnswers, type PhotoKey, type ScoreResult } from "./scoring";
import { hashPassword } from "./server";

// Every action re-checks the caller is an active admin, writes with the
// service client and records an audit event, like the rest of the admin area.

export interface AssessActionState {
  ok?: boolean;
  error?: string;
  message?: string;
  problems?: string[];
}

const db = () => createAdminClient();

async function audit(actorId: string, action: string, targetId: string, details: Record<string, unknown> = {}) {
  await db().from("audit_events").insert({ actor_id: actorId, action, target_type: "assessment", target_id: targetId, details });
}

function newSlug(prefix = "listing") {
  const base = prefix.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 20) || "listing";
  return `${base}-${randomBytes(6).toString("hex")}`;
}

const isId = (s: string) => /^[0-9a-f-]{36}$/.test(s);
const paths = (id: string) => {
  revalidatePath("/admin/assessments");
  revalidatePath(`/admin/assessments/${id}`);
};

export async function createAssessment(formData: FormData) {
  const { profile: me } = await requireAdmin();
  const fromSample = formData.get("from") === "sample";
  const { data, error } = await db().from("assessments").insert({
    title: fromSample ? SAMPLE_TITLE : "New listing assessment",
    slug: newSlug("listing"),
    intro: SAMPLE_INTRO,
    case_study: fromSample ? SAMPLE_CASE_STUDY : "# Property name\n\nWrite the case study here.",
    config: fromSample ? SAMPLE_CONFIG : { fields: {} },
    time_limit_minutes: 120,
    is_open: false,
    created_by: me.id,
  }).select("id").single();
  if (error || !data) throw new Error(`Couldn't create the assessment: ${error?.message}`);
  await audit(me.id, "assessment_create", data.id, { from: fromSample ? "sample" : "blank" });
  revalidatePath("/admin/assessments");
  redirect(`/admin/assessments/${data.id}?tab=${fromSample ? "setup" : "case"}`);
}

export async function duplicateAssessment(formData: FormData) {
  const { profile: me } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!isId(id)) return;
  const { data: src } = await db().from("assessments").select("title, intro, case_study, config, time_limit_minutes").eq("id", id).single();
  if (!src) return;
  const { data } = await db().from("assessments").insert({
    title: `${src.title} (copy)`.slice(0, 200), slug: newSlug(src.title), intro: src.intro, case_study: src.case_study,
    config: src.config, time_limit_minutes: src.time_limit_minutes, is_open: false, created_by: me.id,
  }).select("id").single();
  if (!data) return;
  await audit(me.id, "assessment_duplicate", data.id, { from: id });
  revalidatePath("/admin/assessments");
  redirect(`/admin/assessments/${data.id}?tab=setup`);
}

export async function saveSettings(_: AssessActionState | undefined, fd: FormData): Promise<AssessActionState> {
  const { profile: me } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!isId(id)) return { error: "Unknown assessment." };
  const title = String(fd.get("title") ?? "").trim().slice(0, 200);
  const minutes = Math.round(Number(fd.get("minutes")));
  const intro = String(fd.get("intro") ?? "").slice(0, 10_000);
  if (!title) return { error: "Give the assessment a title." };
  if (!Number.isFinite(minutes) || minutes < 5 || minutes > 240) return { error: "Time limit must be between 5 and 240 minutes." };
  const { error } = await db().from("assessments").update({ title, time_limit_minutes: minutes, intro, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  await audit(me.id, "assessment_settings", id, { title, time_limit_minutes: minutes });
  paths(id);
  return { ok: true, message: "Saved. A new time limit applies to candidates who start from now on." };
}

export async function setOpen(fd: FormData) {
  const { profile: me } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const open = fd.get("open") === "1";
  if (!isId(id)) return;
  if (open) {
    const { data } = await db().from("assessments").select("config, case_study").eq("id", id).single();
    const problems = data ? configProblems(cleanConfig(data.config)) : ["Not found"];
    if (problems.length || !data?.case_study.trim()) {
      redirect(`/admin/assessments/${id}?tab=key&cantopen=1`);
    }
  }
  await db().from("assessments").update({ is_open: open, updated_at: new Date().toISOString() }).eq("id", id);
  await audit(me.id, open ? "assessment_open" : "assessment_close", id);
  paths(id);
}

/** Replaces the case study, instructions and answer key with the latest
 * built-in sample. Photos, settings and candidates are kept; anyone who has
 * already started keeps the version they started with. */
export async function refreshFromSample(fd: FormData) {
  const { profile: me } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!isId(id)) return;
  const { data } = await db().from("assessments").select("config").eq("id", id).single();
  if (!data) return;
  const photos = cleanConfig(data.config).photos;
  await db().from("assessments").update({
    intro: SAMPLE_INTRO, case_study: SAMPLE_CASE_STUDY, config: { ...SAMPLE_CONFIG, photos }, updated_at: new Date().toISOString(),
  }).eq("id", id);
  await audit(me.id, "assessment_refresh_from_sample", id);
  paths(id);
  redirect(`/admin/assessments/${id}?tab=case&refreshed=1`);
}

export async function newLink(fd: FormData) {
  const { profile: me } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!isId(id)) return;
  const { data } = await db().from("assessments").select("title").eq("id", id).single();
  await db().from("assessments").update({ slug: newSlug(data?.title), updated_at: new Date().toISOString() }).eq("id", id);
  await audit(me.id, "assessment_new_link", id);
  paths(id);
}

export async function setArchived(fd: FormData) {
  const { profile: me } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const archive = fd.get("archive") === "1";
  if (!isId(id)) return;
  await db().from("assessments").update({ archived_at: archive ? new Date().toISOString() : null, is_open: false, updated_at: new Date().toISOString() }).eq("id", id);
  await audit(me.id, archive ? "assessment_archive" : "assessment_unarchive", id);
  paths(id);
}

export async function saveCaseStudy(_: AssessActionState | undefined, fd: FormData): Promise<AssessActionState> {
  const { profile: me } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!isId(id)) return { error: "Unknown assessment." };
  const text = String(fd.get("caseStudy") ?? "").slice(0, 100_000);
  if (!text.trim()) return { error: "The case study can't be empty." };
  const { error } = await db().from("assessments").update({ case_study: text, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  await audit(me.id, "assessment_case_study", id, { length: text.length });
  paths(id);
  return { ok: true, message: "Case study saved. Candidates who have already started keep the version they started with." };
}

/** Saves the answer key. Problems are reported but don't block saving, so
 * work in progress isn't lost; an assessment can't be opened until it's clean. */
export async function saveConfig(id: string, raw: unknown): Promise<AssessActionState> {
  const { profile: me } = await requireAdmin();
  if (!isId(id)) return { error: "Unknown assessment." };
  const { data: current } = await db().from("assessments").select("config").eq("id", id).single();
  // Photos are managed on their own tab, so keep whatever is stored.
  const config = { ...cleanConfig({ fields: (raw as { fields?: unknown })?.fields }), photos: cleanConfig(current?.config).photos };
  const { error } = await db().from("assessments").update({ config, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  await audit(me.id, "assessment_answer_key", id, { fields: Object.keys(config.fields).length });
  paths(id);
  const problems = configProblems(config);
  return { ok: problems.length === 0, problems, message: problems.length ? undefined : "Answer key saved." };
}

/** Re-marks every submitted attempt against the current answer key (after
 * fixing a mistake in the key). Candidates' answers are not changed. */
export async function remarkAll(fd: FormData) {
  const { profile: me } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!isId(id)) return;
  const { data: a } = await db().from("assessments").select("config").eq("id", id).single();
  if (!a) return;
  const config = cleanConfig(a.config);
  if (configProblems(config).length) redirect(`/admin/assessments/${id}?tab=key&cantopen=1`);
  const { data: attempts } = await db().from("assessment_attempts").select("id, answers, config_snapshot").eq("assessment_id", id).not("submitted_at", "is", null);
  let n = 0;
  for (const att of attempts ?? []) {
    // Mark only the fields the candidate was shown when they sat the test.
    const shown = new Set(formFieldIds(cleanConfig(att.config_snapshot)));
    const fields = Object.fromEntries(Object.entries(config.fields).filter(([fid]) => shown.has(fid)));
    const result = scoreAnswers({ fields, photos: config.photos }, cleanAnswers([...shown], att.answers));
    const snapshot = { fields: { ...cleanConfig(att.config_snapshot).fields, ...fields }, photos: config.photos ?? [] };
    await db().from("assessment_attempts").update({ score: result, accuracy: Math.round(result.accuracy * 1000) / 1000, config_snapshot: snapshot }).eq("id", att.id);
    n++;
  }
  await audit(me.id, "assessment_remark", id, { attempts: n });
  paths(id);
  redirect(`/admin/assessments/${id}?remarked=${n}`);
}

/** Marks the admin's own preview answers. Nothing is stored. */
export async function previewScore(id: string, raw: unknown): Promise<ScoreResult | { error: string }> {
  await requireAdmin();
  if (!isId(id)) return { error: "Unknown assessment." };
  const { data } = await db().from("assessments").select("config").eq("id", id).single();
  if (!data) return { error: "Unknown assessment." };
  const config = cleanConfig(data.config);
  return scoreAnswers(config, cleanAnswers(formFieldIds(config), raw));
}

export async function deleteCandidate(fd: FormData) {
  const { profile: me } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const candidateId = String(fd.get("candidateId") ?? "");
  if (!isId(id) || !isId(candidateId)) return;
  const { data: c } = await db().from("assessment_candidates").select("email").eq("id", candidateId).eq("assessment_id", id).single();
  if (!c) return;
  // Sessions and the attempt go with the candidate (on delete cascade).
  await db().from("assessment_candidates").delete().eq("id", candidateId);
  await audit(me.id, "assessment_delete_candidate", id, { candidate: candidateId, email: c.email });
  paths(id);
  redirect(`/admin/assessments/${id}?deleted=1`);
}

/** Lets a candidate start again: removes their attempt but keeps their
 * registration. Use when someone was cut off by a genuine technical problem. */
export async function resetAttempt(fd: FormData) {
  const { profile: me } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const candidateId = String(fd.get("candidateId") ?? "");
  const reason = String(fd.get("reason") ?? "").trim().slice(0, 500);
  if (!isId(id) || !isId(candidateId) || !reason) return;
  const { data: att } = await db().from("assessment_attempts").select("id, accuracy, time_taken_seconds, answers").eq("candidate_id", candidateId).eq("assessment_id", id).maybeSingle();
  if (!att) return;
  await db().from("assessment_attempts").delete().eq("id", att.id);
  await db().from("audit_events").insert({
    actor_id: me.id, action: "assessment_reset_attempt", target_type: "assessment", target_id: id, reason,
    details: { candidate: candidateId, previous_accuracy: att.accuracy, previous_time_taken_seconds: att.time_taken_seconds, previous_answers: att.answers },
  });
  paths(id);
  revalidatePath(`/admin/assessments/${id}/candidates/${candidateId}`);
}

export async function setCandidatePassword(_: AssessActionState | undefined, fd: FormData): Promise<AssessActionState> {
  const { profile: me } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const candidateId = String(fd.get("candidateId") ?? "");
  const password = String(fd.get("password") ?? "");
  if (!isId(id) || !isId(candidateId)) return { error: "Unknown candidate." };
  if (password.length < 8) return { error: "Use at least 8 characters." };
  const { error } = await db().from("assessment_candidates").update({ password_hash: await hashPassword(password) }).eq("id", candidateId).eq("assessment_id", id);
  if (error) return { error: error.message };
  await db().from("assessment_sessions").delete().eq("candidate_id", candidateId);
  await audit(me.id, "assessment_candidate_password", id, { candidate: candidateId });
  return { ok: true, message: "Password set. Send it to the candidate yourself." };
}

// ─── Photos ───────────────────────────────────────────────────────────

const PHOTO_EXT = /\.(jpe?g|png|webp)$/i;

async function readConfig(id: string) {
  const { data } = await db().from("assessments").select("config").eq("id", id).single();
  return data ? cleanConfig(data.config) : null;
}

async function writePhotos(id: string, photos: PhotoKey[]) {
  const config = await readConfig(id);
  if (!config) throw new Error("Unknown assessment");
  await db().from("assessments").update({ config: { ...config, photos }, updated_at: new Date().toISOString() }).eq("id", id);
}

/** A one-off link the admin's browser uploads a photo to. */
export async function photoUploadTicket(id: string, fileName: string): Promise<{ path: string; token: string } | { error: string }> {
  await requireAdmin();
  if (!isId(id)) return { error: "Unknown assessment." };
  const ext = PHOTO_EXT.exec(fileName)?.[1]?.toLowerCase().replace("jpeg", "jpg");
  if (!ext) return { error: `${fileName}: use JPG, PNG or WebP images.` };
  const path = `${id}/${randomUUID()}.${ext}`;
  const { data, error } = await db().storage.from(PHOTO_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { error: `Couldn't prepare the upload: ${error?.message ?? "unknown error"}` };
  return { path, token: data.token };
}

/** Registers an uploaded photo. The server reads the file back and hashes it
 * itself, so the hash candidates are matched against can be trusted. */
export async function addPhoto(id: string, path: string, name: string): Promise<{ ok: true } | { error: string }> {
  const { profile: me } = await requireAdmin();
  if (!isId(id) || !path.startsWith(`${id}/`) || !PHOTO_EXT.test(path)) return { error: "Unknown upload." };
  const { data: file, error } = await db().storage.from(PHOTO_BUCKET).download(path);
  if (error || !file) return { error: "The upload couldn't be read back. Try again." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const hash = sha256Hex(bytes);
  const config = await readConfig(id);
  if (!config) return { error: "Unknown assessment." };
  const photos = config.photos ?? [];
  if (photos.some((p) => p.hash === hash)) {
    await db().storage.from(PHOTO_BUCKET).remove([path]);
    return { error: `${name} is already uploaded.` };
  }
  if (photos.length >= 60) return { error: "60 photos is the maximum." };
  photos.push({ id: randomUUID(), path, hash, category: "other", name: name.slice(0, 200) });
  await writePhotos(id, photos);
  await audit(me.id, "assessment_photo_add", id, { name });
  paths(id);
  return { ok: true };
}

export async function setPhotoCategory(id: string, photoId: string, category: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (!isId(id) || !PHOTO_CATEGORIES.some((c) => c.value === category)) return { ok: false };
  const config = await readConfig(id);
  if (!config?.photos) return { ok: false };
  await writePhotos(id, config.photos.map((p) => (p.id === photoId ? { ...p, category: category as PhotoCategory } : p)));
  paths(id);
  return { ok: true };
}

/** Takes a photo out of the assessment. The file itself is kept, because
 * attempts that have already started may still use it. */
export async function removePhoto(id: string, photoId: string): Promise<{ ok: boolean }> {
  const { profile: me } = await requireAdmin();
  if (!isId(id)) return { ok: false };
  const config = await readConfig(id);
  if (!config?.photos) return { ok: false };
  const gone = config.photos.find((p) => p.id === photoId);
  await writePhotos(id, config.photos.filter((p) => p.id !== photoId));
  await audit(me.id, "assessment_photo_remove", id, { name: gone?.name });
  paths(id);
  return { ok: true };
}

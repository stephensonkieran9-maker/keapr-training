"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanDraft, normaliseDraft, publishProblems, type CourseDraft } from "./draft.ts";

// Every action re-checks that the caller is an active admin on the server,
// then uses the service client for the write and records an audit event.

export interface ActionState {
  ok?: boolean;
  error?: string;
  message?: string;
  link?: string;
  problems?: string[];
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
}

async function audit(actorId: string, action: string, targetType: string, targetId: string | null, details: Record<string, unknown> = {}, reason?: string) {
  const admin = createAdminClient();
  await admin.from("audit_events").insert({ actor_id: actorId, action, target_type: targetType, target_id: targetId, details, reason: reason ?? null });
}

function signInLink(hashedToken: string, type: "invite" | "recovery"): string {
  return `${siteUrl()}/auth/callback?token_hash=${encodeURIComponent(hashedToken)}&type=${type}`;
}

// ─── Staff ───────────────────────────────────────────────────────────────

export async function inviteStaff(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile: me } = await requireAdmin();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = formData.get("role") === "admin" ? "admin" : "learner";

  if (!fullName) return { error: "Enter the person's full name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };

  const admin = createAdminClient();
  const { data: existing } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (existing) return { error: "Someone with that email already has an account. Open them in the staff list instead." };

  // Creates the account without sending an email and returns a one-time link
  // the admin can send however they like.
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { data: { full_name: fullName }, redirectTo: `${siteUrl()}/auth/set-password` },
  });
  if (error || !data?.user || !data.properties?.hashed_token) {
    return { error: `The invitation couldn't be created: ${error?.message ?? "unknown error"}` };
  }

  // The profile is created by a database trigger; set the name and role.
  await admin.from("profiles").update({ full_name: fullName, role }).eq("id", data.user.id);
  await admin.from("invitations").insert({ email, full_name: fullName, role, invited_by: me.id });
  await audit(me.id, "invite", "profile", data.user.id, { email, role });

  revalidatePath("/admin/staff");
  return {
    ok: true,
    message: `${fullName} has been added. Send them this link to choose a password and sign in.`,
    link: signInLink(data.properties.hashed_token, "invite"),
  };
}

export async function createSignInLink(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile: me } = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const admin = createAdminClient();
  const { data: target } = await admin.from("profiles").select("email, is_active").eq("id", userId).maybeSingle();
  if (!target) return { error: "That person couldn't be found." };
  if (!target.is_active) return { error: "Reactivate this account before sending a sign-in link." };

  // Someone who never accepted their invitation gets a fresh invite link;
  // everyone else gets a password reset link.
  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  const type: "invite" | "recovery" = authUser?.user?.email_confirmed_at ? "recovery" : "invite";

  const { data, error } = await admin.auth.admin.generateLink({ type, email: target.email });
  if (error || !data.properties?.hashed_token) return { error: `The link couldn't be created: ${error?.message ?? "unknown error"}` };

  await audit(me.id, "sign_in_link", "profile", userId, { type });
  return {
    ok: true,
    message: "Send this link. It lets them choose a password and sign in. It works once and expires.",
    link: signInLink(data.properties.hashed_token, type),
  };
}

export async function setRole(formData: FormData) {
  const { profile: me } = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const role = formData.get("role") === "admin" ? "admin" : "learner";
  if (userId === me.id && role !== "admin") {
    redirect(`/admin/staff/${userId}?error=self-demote`);
  }
  const admin = createAdminClient();
  await admin.from("profiles").update({ role }).eq("id", userId);
  await audit(me.id, "role_change", "profile", userId, { role });
  revalidatePath(`/admin/staff/${userId}`);
  revalidatePath("/admin/staff");
}

export async function setActive(formData: FormData) {
  const { profile: me } = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const active = formData.get("active") === "true";
  if (userId === me.id && !active) {
    redirect(`/admin/staff/${userId}?error=self-deactivate`);
  }
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ is_active: active, deactivated_at: active ? null : new Date().toISOString() })
    .eq("id", userId);
  // Block or restore sign-in at the auth level too. Training history is kept.
  await admin.auth.admin.updateUserById(userId, { ban_duration: active ? "none" : "876000h" });
  await audit(me.id, active ? "reactivate" : "deactivate", "profile", userId);
  revalidatePath(`/admin/staff/${userId}`);
  revalidatePath("/admin/staff");
}

export async function assignCourse(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile: me } = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  if (!courseId) return { error: "Choose a course to assign." };

  const admin = createAdminClient();
  const { data: version } = await admin
    .from("course_versions")
    .select("id, version")
    .eq("course_id", courseId)
    .eq("status", "published")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!version) return { error: "That course hasn't been published yet." };

  // Already actively assigned to any version of this course?
  const { data: versionIds } = await admin.from("course_versions").select("id").eq("course_id", courseId);
  const ids = (versionIds ?? []).map((v) => v.id);
  const { data: active } = await admin
    .from("enrolments")
    .select("id")
    .eq("learner_id", userId)
    .in("course_version_id", ids)
    .is("unassigned_at", null)
    .limit(1);
  if (active && active.length) return { error: "This course is already assigned to them." };

  // Re-assigning a version they were unassigned from (with progress kept)
  // picks up where they left off. Cleared assignments start fresh.
  const { data: previous } = await admin
    .from("enrolments")
    .select("id")
    .eq("learner_id", userId)
    .eq("course_version_id", version.id)
    .is("progress_cleared_at", null)
    .not("unassigned_at", "is", null)
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (previous) {
    await admin.from("enrolments").update({ unassigned_at: null, assigned_by: me.id, assigned_at: new Date().toISOString() }).eq("id", previous.id);
  } else {
    const { error } = await admin.from("enrolments").insert({ learner_id: userId, course_version_id: version.id, assigned_by: me.id });
    if (error) return { error: `The course couldn't be assigned: ${error.message}` };
  }
  await audit(me.id, "assign", "profile", userId, { course_id: courseId, course_version_id: version.id });
  revalidatePath(`/admin/staff/${userId}`);
  revalidatePath("/admin/staff");
  return { ok: true, message: "Course assigned." };
}

export async function unassignCourse(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile: me } = await requireAdmin();
  const enrolmentId = String(formData.get("enrolmentId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const mode = String(formData.get("mode") ?? "keep") as "keep" | "clear" | "reset";
  const reason = String(formData.get("reason") ?? "").trim();
  const admin = createAdminClient();

  const { data: enrolment } = await admin
    .from("enrolments")
    .select("id, course_version_id, course_versions(course_id)")
    .eq("id", enrolmentId)
    .eq("learner_id", userId)
    .maybeSingle();
  if (!enrolment) return { error: "That assignment couldn't be found." };

  if (mode === "keep") {
    await admin.from("enrolments").update({ unassigned_at: new Date().toISOString() }).eq("id", enrolmentId);
    await audit(me.id, "unassign", "enrolment", enrolmentId, { learner_id: userId, progress: "kept" }, reason || undefined);
  } else {
    if (formData.get("confirm") !== "yes") return { error: "Tick the box to confirm you want to clear their progress." };
    const { error } = await admin.rpc("clear_enrolment_progress", { p_enrolment: enrolmentId, p_actor: me.id, p_reason: reason });
    if (error) return { error: `Progress couldn't be cleared: ${error.message}. Has migration 0006 been run?` };

    if (mode === "reset") {
      // Start again on the latest published version of the same course.
      const v = enrolment.course_versions as unknown as { course_id: string } | { course_id: string }[] | null;
      const courseId = Array.isArray(v) ? v[0]?.course_id : v?.course_id;
      const { data: latest } = await admin
        .from("course_versions")
        .select("id")
        .eq("course_id", courseId ?? "")
        .eq("status", "published")
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      const versionId = latest?.id ?? enrolment.course_version_id;
      const { error: insErr } = await admin.from("enrolments").insert({ learner_id: userId, course_version_id: versionId, assigned_by: me.id });
      if (insErr) return { error: `Progress was cleared, but the course couldn't be reassigned: ${insErr.message}` };
      await audit(me.id, "reset", "enrolment", enrolmentId, { learner_id: userId, new_version_id: versionId }, reason || undefined);
    }
  }

  revalidatePath(`/admin/staff/${userId}`);
  revalidatePath("/admin/staff");
  revalidatePath("/admin");
  return {
    ok: true,
    message: mode === "keep" ? "Unassigned. Their progress is kept." : mode === "clear" ? "Unassigned and progress cleared." : "Progress reset. They start again from lesson 1.",
  };
}

// ─── Courses ─────────────────────────────────────────────────────────────

export async function createCourse(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile: me } = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title) return { error: "Give the course a title." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("courses")
    .insert({ title, description, created_by: me.id, draft: { lessons: [] } })
    .select("id")
    .single();
  if (error || !data) return { error: `The course couldn't be created: ${error?.message ?? "unknown error"}` };
  await audit(me.id, "create_course", "course", data.id, { title });
  redirect(`/admin/courses/${data.id}`);
}

export async function saveCourseDraft(courseId: string, details: { title: string; description: string }, draft: CourseDraft): Promise<ActionState> {
  const { profile: me } = await requireAdmin();
  const title = details.title.trim();
  if (!title) return { error: "Give the course a title." };
  const admin = createAdminClient();
  const { error } = await admin
    .from("courses")
    .update({ title, description: details.description.trim(), draft: normaliseDraft(draft), updated_at: new Date().toISOString() })
    .eq("id", courseId);
  if (error) return { error: `The draft couldn't be saved: ${error.message}` };
  await audit(me.id, "save_draft", "course", courseId);
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/admin/courses");
  return { ok: true, message: "Draft saved." };
}

export async function publishCourse(courseId: string, details: { title: string; description: string }, draft: CourseDraft): Promise<ActionState> {
  const { profile: me } = await requireAdmin();
  const cleaned = cleanDraft(normaliseDraft(draft));
  const problems = publishProblems(cleaned);
  if (!details.title.trim()) problems.unshift("Give the course a title.");
  if (problems.length) return { error: "Fix these before publishing:", problems };

  const admin = createAdminClient();
  const { error: saveError } = await admin
    .from("courses")
    .update({ title: details.title.trim(), description: details.description.trim(), draft: cleaned, updated_at: new Date().toISOString() })
    .eq("id", courseId);
  if (saveError) return { error: `The draft couldn't be saved: ${saveError.message}` };

  const { error } = await admin.rpc("publish_course", { p_course_id: courseId, p_actor: me.id });
  if (error) return { error: `Publishing failed: ${error.message}` };

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/admin/courses");
  return { ok: true, message: "Published. New assignments will get this version; people already on the course keep the version they started." };
}

// ─── Video uploads ───────────────────────────────────────────────────────

export interface UploadTicket {
  ok: boolean;
  error?: string;
  path?: string;
  token?: string;
}

/** A one-time upload URL into the private lesson-videos bucket. The file
 * goes straight from the admin's browser to storage. */
export async function createVideoUpload(courseId: string, fileName: string): Promise<UploadTicket> {
  const { profile: me } = await requireAdmin();
  const safe = fileName.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "").slice(-60) || "video.mp4";
  const path = `${courseId}/${Date.now()}-${safe}`;
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("lesson-videos").createSignedUploadUrl(path);
  if (error || !data) {
    return { ok: false, error: `Upload couldn't start: ${error?.message ?? "unknown error"}. Has migration 0005 been run?` };
  }
  await audit(me.id, "video_upload", "course", courseId, { path });
  return { ok: true, path: data.path, token: data.token };
}

// ─── Overrides ───────────────────────────────────────────────────────────

/** Marks a lesson complete for someone, with a required reason. */
export async function markLessonComplete(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile: me } = await requireAdmin();
  const enrolmentId = String(formData.get("enrolmentId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "Add a reason. It's saved with the completion." };
  if (formData.get("confirm") !== "yes") return { error: "Tick the box to confirm." };

  const admin = createAdminClient();
  const { data: enrolment } = await admin.from("enrolments").select("id").eq("id", enrolmentId).eq("learner_id", userId).maybeSingle();
  if (!enrolment) return { error: "That assignment wasn't found." };

  const { data, error } = await admin.rpc("admin_complete_lesson", { p_enrolment: enrolmentId, p_lesson: lessonId, p_actor: me.id, p_reason: reason });
  if (error) {
    if (/function .*admin_complete_lesson|Could not find the function/i.test(error.message)) {
      return { error: "Run migration 0007_admin_complete_lesson.sql in Supabase first." };
    }
    if (error.message.includes("NOT_ENROLLED")) return { error: "This course isn't assigned to them any more." };
    console.error(`[admin] mark complete failed: ${error.message}`);
    return { error: "The lesson couldn't be marked complete. Try again." };
  }

  const r = data as { already_complete: boolean; course_completed: boolean };
  revalidatePath(`/admin/staff/${userId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  if (r.already_complete) return { ok: true, message: "That lesson was already complete." };
  return { ok: true, message: r.course_completed ? "Marked complete. That finishes the course." : "Marked complete. The next lesson is now unlocked for them." };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notifications";
import type { ActionState } from "./actions";

// Training paths. Every action re-checks the caller is an admin.

const MIGRATION_0011 = "Run migration 0011_training_paths.sql in Supabase first.";
const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

function friendly(message: string, fallback: string) {
  return /training_path|path_assign|assign_path|sync_path|Could not find the function|relation .* does not exist/i.test(message) ? MIGRATION_0011 : `${fallback}: ${message}`;
}

async function audit(actorId: string, action: string, targetId: string | null, details: Record<string, unknown> = {}) {
  await createAdminClient().from("audit_events").insert({ actor_id: actorId, action, target_type: "path", target_id: targetId, details });
}

async function courseTitles(ids: string[]): Promise<Map<string, string>> {
  if (!ids.length) return new Map();
  const { data } = await createAdminClient().from("courses").select("id, title").in("id", ids);
  return new Map((data ?? []).map((c) => [c.id as string, c.title as string]));
}

function revalidateAll(pathId?: string) {
  revalidatePath("/admin/paths");
  if (pathId) revalidatePath(`/admin/paths/${pathId}`);
  revalidatePath("/admin/courses");
  revalidatePath("/admin/staff", "layout");
  revalidatePath("/admin");
}

/** Tells each person about courses newly assigned to them by a path. */
async function notifyAssigned(pairs: { learner_id: string; course_id: string }[], pathName: string) {
  const titles = await courseTitles([...new Set(pairs.map((p) => p.course_id))]);
  const byLearner = new Map<string, string[]>();
  pairs.forEach((p) => byLearner.set(p.learner_id, [...(byLearner.get(p.learner_id) ?? []), titles.get(p.course_id) ?? "a course"]));
  for (const [learner, list] of byLearner) {
    await notify(learner, {
      kind: "course_assigned",
      title: list.length === 1 ? `New course: ${list[0]}` : `${list.length} new courses in ${pathName}`,
      body: list.length === 1 ? `Added through the ${pathName} path.` : list.join(", "),
      link: "/dashboard",
    });
  }
}

// ─── Paths ───────────────────────────────────────────────────────────────

export async function createPath(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile: me } = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const description = String(formData.get("description") ?? "").trim().slice(0, 500);
  if (!name) return { error: "Give the path a name, for example the team it's for." };
  const { data, error } = await createAdminClient().from("training_paths").insert({ name, description, created_by: me.id }).select("id").single();
  if (error || !data) return { error: friendly(error?.message ?? "unknown error", "The path couldn't be created") };
  await audit(me.id, "create_path", data.id, { name });
  revalidateAll();
  redirect(`/admin/paths/${data.id}`);
}

export async function updatePathDetails(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile: me } = await requireAdmin();
  const pathId = String(formData.get("pathId") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const description = String(formData.get("description") ?? "").trim().slice(0, 500);
  if (!name) return { error: "Give the path a name." };
  const { error } = await createAdminClient().from("training_paths").update({ name, description, updated_at: new Date().toISOString() }).eq("id", pathId);
  if (error) return { error: friendly(error.message, "The path couldn't be saved") };
  await audit(me.id, "update_path", pathId, { name });
  revalidateAll(pathId);
  return { ok: true, message: "Saved." };
}

/** Saves the course order, then assigns any new courses to everyone on the path. */
export async function savePathCourses(pathId: string, courseIds: string[]): Promise<ActionState> {
  const { profile: me } = await requireAdmin();
  const ids = [...new Set(courseIds.filter(isUuid))].slice(0, 100);
  const admin = createAdminClient();

  const { data: path, error: pErr } = await admin.from("training_paths").select("name").eq("id", pathId).maybeSingle();
  if (pErr) return { error: friendly(pErr.message, "The path couldn't be loaded") };
  if (!path) return { error: "Path not found." };

  const { error: delErr } = await admin.from("training_path_courses").delete().eq("path_id", pathId);
  if (delErr) return { error: friendly(delErr.message, "The order couldn't be saved") };
  if (ids.length) {
    const { error } = await admin.from("training_path_courses").insert(ids.map((course_id, i) => ({ path_id: pathId, course_id, position: i + 1 })));
    if (error) return { error: friendly(error.message, "The order couldn't be saved") };
  }
  await admin.from("training_paths").update({ updated_at: new Date().toISOString() }).eq("id", pathId);

  const { data: added, error: syncErr } = await admin.rpc("sync_path", { p_path: pathId, p_actor: me.id });
  if (syncErr) console.error(`[paths] sync failed: ${syncErr.message}`);
  const pairs = (added ?? []) as { learner_id: string; course_id: string }[];
  await notifyAssigned(pairs, path.name);

  await audit(me.id, "path_courses", pathId, { order: ids, newly_assigned: pairs.length });
  revalidateAll(pathId);
  revalidatePath("/dashboard");
  return {
    ok: true,
    message: pairs.length
      ? `Saved. ${pairs.length} new course assignment${pairs.length === 1 ? "" : "s"} for people already on this path.`
      : "Saved. Courses open in this order for everyone on the path.",
  };
}

/** Deletes the path. People keep the courses it gave them; the order just stops applying. */
export async function deletePath(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile: me } = await requireAdmin();
  const pathId = String(formData.get("pathId") ?? "");
  if (formData.get("confirm") !== "yes") return { error: "Tick the box to confirm." };
  const admin = createAdminClient();
  const { data: path } = await admin.from("training_paths").select("name").eq("id", pathId).maybeSingle();
  const { error } = await admin.from("training_paths").delete().eq("id", pathId);
  if (error) return { error: friendly(error.message, "The path couldn't be deleted") };
  await audit(me.id, "delete_path", pathId, { name: path?.name });
  revalidateAll();
  revalidatePath("/dashboard");
  redirect("/admin/paths?deleted=1");
}

// ─── People ──────────────────────────────────────────────────────────────

async function assignOne(pathId: string, pathName: string, userId: string, actorId: string): Promise<{ error?: string; courses: number }> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("assign_path", { p_path: pathId, p_learner: userId, p_actor: actorId });
  if (error) return { error: friendly(error.message, "The path couldn't be assigned"), courses: 0 };
  const newCourses = (data ?? []) as string[];
  const titles = await courseTitles(newCourses);
  await notify(userId, {
    kind: "course_assigned",
    title: `You've been added to the ${pathName} path`,
    body: newCourses.length
      ? `${newCourses.length} course${newCourses.length === 1 ? "" : "s"} added: ${newCourses.map((id) => titles.get(id) ?? "a course").join(", ")}. They open in order.`
      : "Your courses now open in this path's order.",
    link: "/dashboard",
  });
  return { courses: newCourses.length };
}

/** From a person's Staff page. */
export async function assignPathToPerson(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile: me } = await requireAdmin();
  const pathId = String(formData.get("pathId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!pathId) return { error: "Choose a path." };
  const { data: path } = await createAdminClient().from("training_paths").select("name").eq("id", pathId).maybeSingle();
  if (!path) return { error: "Path not found." };
  const r = await assignOne(pathId, path.name, userId, me.id);
  if (r.error) return { error: r.error };
  revalidateAll(pathId);
  revalidatePath(`/admin/staff/${userId}`);
  return { ok: true, message: r.courses ? `Added to ${path.name}. ${r.courses} course${r.courses === 1 ? "" : "s"} assigned.` : `Added to ${path.name}.` };
}

/** From a path's page: several people at once. */
export async function assignPathToPeople(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile: me } = await requireAdmin();
  const pathId = String(formData.get("pathId") ?? "");
  const userIds = formData.getAll("userId").map(String).filter(isUuid);
  if (!userIds.length) return { error: "Tick at least one person." };
  const { data: path } = await createAdminClient().from("training_paths").select("name").eq("id", pathId).maybeSingle();
  if (!path) return { error: "Path not found." };
  let courses = 0;
  for (const userId of userIds) {
    const r = await assignOne(pathId, path.name, userId, me.id);
    if (r.error) return { error: r.error };
    courses += r.courses;
  }
  revalidateAll(pathId);
  return { ok: true, message: `Added ${userIds.length} ${userIds.length === 1 ? "person" : "people"}${courses ? `, ${courses} course assignment${courses === 1 ? "" : "s"}` : ""}.` };
}

/** Takes someone off a path. Optionally also unassigns its courses (progress kept),
 * except any course another of their paths still needs. */
export async function removePathFromPerson(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile: me } = await requireAdmin();
  const pathId = String(formData.get("pathId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const removeCourses = formData.get("removeCourses") === "yes";
  const admin = createAdminClient();

  const { data: path } = await admin.from("training_paths").select("name").eq("id", pathId).maybeSingle();
  const { error } = await admin.from("path_assignments").update({ unassigned_at: new Date().toISOString() }).eq("path_id", pathId).eq("learner_id", userId).is("unassigned_at", null);
  if (error) return { error: friendly(error.message, "The path couldn't be removed") };

  let removed = 0;
  if (removeCourses) {
    const [{ data: thisPath }, { data: otherPaths }] = await Promise.all([
      admin.from("training_path_courses").select("course_id").eq("path_id", pathId),
      admin.from("path_assignments").select("path_id").eq("learner_id", userId).is("unassigned_at", null),
    ]);
    const otherIds = (otherPaths ?? []).map((p) => p.path_id);
    const { data: stillNeeded } = otherIds.length
      ? await admin.from("training_path_courses").select("course_id").in("path_id", otherIds)
      : { data: [] as { course_id: string }[] };
    const keep = new Set((stillNeeded ?? []).map((c) => c.course_id));
    const courseIds = (thisPath ?? []).map((c) => c.course_id).filter((id) => !keep.has(id));
    if (courseIds.length) {
      const { data: versions } = await admin.from("course_versions").select("id").in("course_id", courseIds);
      const vIds = (versions ?? []).map((v) => v.id);
      if (vIds.length) {
        const { data: rows } = await admin
          .from("enrolments")
          .update({ unassigned_at: new Date().toISOString() })
          .eq("learner_id", userId)
          .in("course_version_id", vIds)
          .is("unassigned_at", null)
          .select("id");
        removed = rows?.length ?? 0;
      }
    }
  }

  await notify(userId, {
    kind: "course_removed",
    title: `You've been taken off the ${path?.name ?? "training"} path`,
    body: removed ? `${removed} course${removed === 1 ? "" : "s"} removed. Your progress is kept in your history.` : undefined,
  });
  await audit(me.id, "remove_path", pathId, { learner_id: userId, courses_removed: removed });
  revalidateAll(pathId);
  revalidatePath(`/admin/staff/${userId}`);
  return { ok: true, message: removed ? `Removed from the path and ${removed} course${removed === 1 ? "" : "s"}.` : "Removed from the path. Their courses are still assigned." };
}

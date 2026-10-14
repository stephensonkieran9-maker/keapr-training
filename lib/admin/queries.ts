import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadLearnerProgress } from "@/lib/learner-progress";
import { normaliseDraft, newKey, type CourseDraft } from "./draft.ts";

// Read helpers for admin pages. Callers must have run requireAdmin() first.

export type StaffStatus = "active" | "invited" | "deactivated";

export interface StaffRow {
  id: string;
  fullName: string;
  email: string;
  role: "learner" | "admin";
  status: StaffStatus;
  lastSignInAt: string | null;
  assignedCount: number;
  completedCount: number;
}

async function authUserMap() {
  const admin = createAdminClient();
  const map = new Map<string, { lastSignInAt: string | null; confirmed: boolean }>();
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) break;
    data.users.forEach((u) => map.set(u.id, { lastSignInAt: u.last_sign_in_at ?? null, confirmed: Boolean(u.email_confirmed_at) }));
    if (data.users.length < 200) break;
  }
  return map;
}

function statusOf(isActive: boolean, auth?: { lastSignInAt: string | null; confirmed: boolean }): StaffStatus {
  if (!isActive) return "deactivated";
  return auth?.lastSignInAt ? "active" : "invited";
}

export async function listStaff(): Promise<StaffRow[]> {
  const admin = createAdminClient();

  // Fast path: one database query (migration 0004).
  const { data: rows, error } = await admin.rpc("admin_staff_overview");
  if (!error && rows) {
    type Row = {
      id: string; full_name: string; email: string; role: "learner" | "admin"; is_active: boolean;
      last_sign_in_at: string | null; email_confirmed_at: string | null; assigned_count: number; completed_count: number;
    };
    return (rows as Row[]).map((r) => ({
      id: r.id,
      fullName: r.full_name,
      email: r.email,
      role: r.role,
      status: statusOf(r.is_active, { lastSignInAt: r.last_sign_in_at, confirmed: Boolean(r.email_confirmed_at) }),
      lastSignInAt: r.last_sign_in_at,
      assignedCount: Number(r.assigned_count),
      completedCount: Number(r.completed_count),
    }));
  }

  // Fallback until migration 0004 is run: slower, uses the auth admin API.
  const [{ data: profiles }, { data: enrolments }, authUsers] = await Promise.all([
    admin.from("profiles").select("id, full_name, email, role, is_active").order("full_name"),
    admin.from("enrolments").select("learner_id, completed_at").is("unassigned_at", null),
    authUserMap(),
  ]);

  return (profiles ?? []).map((p) => {
    const mine = (enrolments ?? []).filter((e) => e.learner_id === p.id);
    const auth = authUsers.get(p.id);
    return {
      id: p.id,
      fullName: p.full_name,
      email: p.email,
      role: p.role,
      status: statusOf(p.is_active, auth),
      lastSignInAt: auth?.lastSignInAt ?? null,
      assignedCount: mine.length,
      completedCount: mine.filter((e) => e.completed_at).length,
    };
  });
}

export async function getStaffMember(id: string) {
  const admin = createAdminClient();
  const { data: p } = await admin.from("profiles").select("id, full_name, email, role, is_active, created_at").eq("id", id).maybeSingle();
  if (!p) return null;
  const [{ data: authData }, progress] = await Promise.all([admin.auth.admin.getUserById(id), loadLearnerProgress(admin, id)]);
  const auth = authData?.user ? { lastSignInAt: authData.user.last_sign_in_at ?? null, confirmed: Boolean(authData.user.email_confirmed_at) } : undefined;
  return {
    id: p.id,
    fullName: p.full_name as string,
    email: p.email as string,
    role: p.role as "learner" | "admin",
    isActive: p.is_active as boolean,
    createdAt: p.created_at as string,
    status: statusOf(p.is_active, auth),
    lastSignInAt: auth?.lastSignInAt ?? null,
    courses: progress.computed.courses,
  };
}

export interface CourseRow {
  id: string;
  title: string;
  description: string;
  isDemo: boolean;
  latestVersion: number | null;
  lessonCount: number;
  assignedCount: number;
  updatedAt: string;
  hasUnpublishedChanges: boolean;
}

export async function listCourses(): Promise<CourseRow[]> {
  const admin = createAdminClient();
  const [{ data: courses }, { data: versions }, { data: enrolments }] = await Promise.all([
    admin.from("courses").select("id, title, description, is_demo, updated_at, draft").order("updated_at", { ascending: false }),
    admin.from("course_versions").select("id, course_id, version, status, published_at, lessons(count)"),
    admin.from("enrolments").select("course_version_id").is("unassigned_at", null),
  ]);

  return (courses ?? []).map((c) => {
    const mine = (versions ?? []).filter((v) => v.course_id === c.id);
    const latest = mine.sort((a, b) => b.version - a.version)[0];
    const versionIds = new Set(mine.map((v) => v.id));
    const lessonCount = latest ? ((latest.lessons as unknown as { count: number }[])?.[0]?.count ?? 0) : normaliseDraft(c.draft).lessons.length;
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      isDemo: c.is_demo,
      latestVersion: latest?.version ?? null,
      lessonCount,
      assignedCount: (enrolments ?? []).filter((e) => versionIds.has(e.course_version_id)).length,
      updatedAt: c.updated_at,
      hasUnpublishedChanges: !latest || new Date(c.updated_at).getTime() > new Date(latest.published_at).getTime() + 1000,
    };
  });
}

export async function publishedCourseOptions(): Promise<{ id: string; title: string }[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("course_versions").select("course_id, title, version").eq("status", "published").order("title");
  return (data ?? []).map((v) => ({ id: v.course_id, title: v.title }));
}

/** The course plus an editable draft. Courses created before the builder
 * (e.g. the demo seed) get a draft built from their latest published version. */
export async function getCourseForEditor(id: string) {
  const admin = createAdminClient();
  const { data: c } = await admin.from("courses").select("id, title, description, is_demo, draft").eq("id", id).maybeSingle();
  if (!c) return null;

  const { data: versions } = await admin
    .from("course_versions")
    .select("id, version, published_at")
    .eq("course_id", id)
    .order("version", { ascending: false });
  const latest = versions?.[0];

  let draft: CourseDraft = normaliseDraft(c.draft);
  if (draft.lessons.length === 0 && latest) draft = await draftFromVersion(latest.id);

  return {
    id: c.id as string,
    title: c.title as string,
    description: c.description as string,
    isDemo: c.is_demo as boolean,
    latestVersion: latest?.version ?? null,
    publishedAt: latest?.published_at ?? null,
    draft,
  };
}

async function draftFromVersion(versionId: string): Promise<CourseDraft> {
  const admin = createAdminClient();
  const { data: lessons } = await admin
    .from("lessons")
    .select(
      `id, position, title, objectives, notes, video_ref, video_seconds, required_watch_ratio, pass_ratio, is_required, estimated_minutes,
       quiz_questions ( id, position, prompt, explanation, quiz_options ( id, position, label ), quiz_answer_keys ( correct_option_id ) )`,
    )
    .eq("course_version_id", versionId)
    .order("position");

  type Opt = { id: string; position: number; label: string };
  type Q = { id: string; position: number; prompt: string; explanation: string; quiz_options: Opt[]; quiz_answer_keys: { correct_option_id: string } | { correct_option_id: string }[] | null };

  return normaliseDraft({
    lessons: (lessons ?? []).map((l) => ({
      key: newKey("l"),
      title: l.title,
      objectives: l.objectives ?? [],
      notes: l.notes ?? "",
      videoRef: l.video_ref ?? "",
      videoSeconds: l.video_seconds,
      passPercent: Math.round(Number(l.pass_ratio) * 100),
      requiredWatchPercent: Math.round(Number(l.required_watch_ratio) * 100),
      isRequired: l.is_required,
      estimatedMinutes: l.estimated_minutes,
      questions: ((l.quiz_questions ?? []) as unknown as Q[])
        .sort((a, b) => a.position - b.position)
        .map((q) => {
          const opts = [...(q.quiz_options ?? [])].sort((a, b) => a.position - b.position);
          const keyRow = Array.isArray(q.quiz_answer_keys) ? q.quiz_answer_keys[0] : q.quiz_answer_keys;
          return {
            key: newKey("q"),
            prompt: q.prompt,
            explanation: q.explanation,
            options: opts.map((o) => o.label),
            correctIndex: Math.max(0, opts.findIndex((o) => o.id === keyRow?.correct_option_id)),
          };
        }),
    })),
  });
}

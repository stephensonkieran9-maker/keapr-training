import "server-only";
import { check, createAdminClient } from "@/lib/supabase/admin";
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
  if (error) console.warn(`[admin] staff overview function unavailable (${error.message}); using slower fallback. Run migration 0004.`);
  const [profilesRes, enrolmentsRes, authUsers] = await Promise.all([
    admin.from("profiles").select("id, full_name, email, role, is_active").order("full_name"),
    admin.from("enrolments").select("learner_id, completed_at").is("unassigned_at", null),
    authUserMap(),
  ]);
  const profiles = check("staff", profilesRes);
  const enrolments = check("assignments", enrolmentsRes);

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
  const enrolmentIds = progress.computed.courses.map((c) => c.enrolmentId);
  const { data: overrideRows } = enrolmentIds.length
    ? await admin
        .from("lesson_completions")
        .select("enrolment_id, lesson_id, override_reason, completed_at")
        .in("enrolment_id", enrolmentIds)
        .eq("source", "admin_override")
        .is("revoked_at", null)
    : { data: [] };
  const overrides = new Map(
    (overrideRows ?? []).map((o) => [`${o.enrolment_id}:${o.lesson_id}`, { reason: o.override_reason as string, at: o.completed_at as string }]),
  );
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
    courses: progress.computed.courses.map((c) => ({
      ...c,
      lessons: (progress.computed.stepsByEnrolment.get(c.enrolmentId) ?? []).map((s) => ({
        ...s,
        override: overrides.get(`${c.enrolmentId}:${s.lessonId}`),
      })),
    })),
  };
}

/** Archive date and training-path position per course. Read separately and
 * empty until migration 0010 is run, so pages keep working before then. */
async function courseMeta(): Promise<{ archived: Map<string, string>; path: Map<string, number> }> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("courses").select("id, archived_at, path_position");
  if (error) return { archived: new Map(), path: new Map() };
  const archived = new Map<string, string>();
  const path = new Map<string, number>();
  for (const c of data ?? []) {
    if (c.archived_at) archived.set(c.id, c.archived_at);
    else if (c.path_position != null) path.set(c.id, c.path_position);
  }
  return { archived, path };
}
async function archivedDates(): Promise<Map<string, string>> {
  return (await courseMeta()).archived;
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
  archivedAt: string | null;
  /** Ever assigned to anyone (including since unassigned): can't be deleted. */
  everAssigned: boolean;
}

export async function listCourses(): Promise<CourseRow[]> {
  const admin = createAdminClient();
  const [coursesRes, versionsRes, enrolmentsRes, meta] = await Promise.all([
    admin.from("courses").select("id, title, description, is_demo, updated_at, draft").order("updated_at", { ascending: false }),
    admin.from("course_versions").select("id, course_id, version, status, published_at, lessons(count)"),
    admin.from("enrolments").select("course_version_id, unassigned_at"),
    courseMeta(),
  ]);
  const courses = check("courses", coursesRes);
  const versions = check("course versions", versionsRes);
  const enrolments = check("assignments", enrolmentsRes);

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
      assignedCount: (enrolments ?? []).filter((e) => versionIds.has(e.course_version_id) && !e.unassigned_at).length,
      everAssigned: (enrolments ?? []).some((e) => versionIds.has(e.course_version_id)),
      archivedAt: meta.archived.get(c.id) ?? null,
      updatedAt: c.updated_at,
      hasUnpublishedChanges: !latest || new Date(c.updated_at).getTime() > new Date(latest.published_at).getTime() + 1000,
    };
  });
}

export async function publishedCourseOptions(): Promise<{ id: string; title: string }[]> {
  const admin = createAdminClient();
  const [{ data }, archived] = await Promise.all([
    admin.from("course_versions").select("course_id, title, version").eq("status", "published").order("title"),
    archivedDates(),
  ]);
  return (data ?? []).filter((v) => !archived.has(v.course_id)).map((v) => ({ id: v.course_id, title: v.title }));
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

  const versionIds = (versions ?? []).map((v) => v.id);
  const [{ count: everCount }, { count: activeCount }, archived] = await Promise.all([
    versionIds.length
      ? admin.from("enrolments").select("id", { count: "exact", head: true }).in("course_version_id", versionIds)
      : Promise.resolve({ count: 0 }),
    versionIds.length
      ? admin.from("enrolments").select("id", { count: "exact", head: true }).in("course_version_id", versionIds).is("unassigned_at", null)
      : Promise.resolve({ count: 0 }),
    archivedDates(),
  ]);

  return {
    id: c.id as string,
    title: c.title as string,
    description: c.description as string,
    isDemo: c.is_demo as boolean,
    latestVersion: latest?.version ?? null,
    publishedAt: latest?.published_at ?? null,
    draft,
    archivedAt: archived.get(c.id) ?? null,
    everAssigned: (everCount ?? 0) > 0,
    activeAssignments: activeCount ?? 0,
  };
}

async function draftFromVersion(versionId: string): Promise<CourseDraft> {
  const admin = createAdminClient();
  const { data: lessons } = await admin
    .from("lessons")
    .select(
      `id, position, title, objectives, notes, video_ref, video_seconds, required_watch_ratio, pass_ratio, is_required, estimated_minutes,
       quiz_questions ( id, position, prompt, explanation, quiz_options ( id, position, label ), quiz_answer_keys ( correct_option_id ) ),
       lesson_resources ( id, title, kind, storage_path, size_bytes )`,
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
      hasQuiz: ((l.quiz_questions ?? []) as unknown as Q[]).length > 0,
      downloads: ((l.lesson_resources ?? []) as unknown as { id: string; title: string; kind: string; storage_path: string; size_bytes: number | null }[]).map((r) => ({
        key: newKey("f"),
        title: r.title,
        ref: r.storage_path,
        sizeBytes: r.size_bytes,
        kind: r.kind,
      })),
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

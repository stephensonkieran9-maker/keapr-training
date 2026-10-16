import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Read helpers for training paths. Callers must run requireAdmin() first.
// Everything returns empty (rather than failing) until migration 0011 is run.

export interface PathCourse {
  courseId: string;
  title: string;
  position: number;
  published: boolean;
  archived: boolean;
}

export interface PathSummary {
  id: string;
  name: string;
  description: string;
  courses: PathCourse[];
  memberCount: number;
}

export interface PathMember {
  learnerId: string;
  name: string;
  email: string;
  isActive: boolean;
  assignedAt: string;
  completedCourses: number;
}

async function courseInfo() {
  const admin = createAdminClient();
  const [{ data: courses }, { data: versions }] = await Promise.all([
    admin.from("courses").select("id, title, archived_at"),
    admin.from("course_versions").select("course_id").eq("status", "published"),
  ]);
  const published = new Set((versions ?? []).map((v) => v.course_id));
  return new Map((courses ?? []).map((c) => [c.id as string, { title: c.title as string, archived: Boolean(c.archived_at), published: published.has(c.id) }]));
}

export async function pathsAvailable(): Promise<boolean> {
  const { error } = await createAdminClient().from("training_paths").select("id").limit(1);
  return !error;
}

export async function listPaths(): Promise<PathSummary[]> {
  const admin = createAdminClient();
  const [pathsRes, pcRes, paRes, info] = await Promise.all([
    admin.from("training_paths").select("id, name, description").order("name"),
    admin.from("training_path_courses").select("path_id, course_id, position"),
    admin.from("path_assignments").select("path_id").is("unassigned_at", null),
    courseInfo(),
  ]);
  if (pathsRes.error) return [];
  return (pathsRes.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    courses: (pcRes.data ?? [])
      .filter((pc) => pc.path_id === p.id)
      .sort((a, b) => a.position - b.position)
      .map((pc) => {
        const c = info.get(pc.course_id);
        return { courseId: pc.course_id, title: c?.title ?? "Unknown course", position: pc.position, published: c?.published ?? false, archived: c?.archived ?? false };
      }),
    memberCount: (paRes.data ?? []).filter((a) => a.path_id === p.id).length,
  }));
}

export async function getPath(id: string): Promise<(PathSummary & { members: PathMember[] }) | null> {
  const admin = createAdminClient();
  const path = (await listPaths()).find((p) => p.id === id);
  if (!path) return null;

  const { data: assignments } = await admin
    .from("path_assignments")
    .select("learner_id, assigned_at, profiles!path_assignments_learner_id_fkey(full_name, email, is_active)")
    .eq("path_id", id)
    .is("unassigned_at", null);

  // Completed courses in this path, per member.
  const courseIds = path.courses.map((c) => c.courseId);
  const learnerIds = (assignments ?? []).map((a) => a.learner_id);
  const { data: done } = courseIds.length && learnerIds.length
    ? await admin
        .from("enrolments")
        .select("learner_id, course_versions!inner(course_id)")
        .in("learner_id", learnerIds)
        .in("course_versions.course_id", courseIds)
        .is("unassigned_at", null)
        .not("completed_at", "is", null)
    : { data: [] as { learner_id: string }[] };

  type Prof = { full_name: string; email: string; is_active: boolean };
  const members = (assignments ?? [])
    .map((a) => {
      const raw = a.profiles as unknown as Prof | Prof[] | null;
      const p = Array.isArray(raw) ? raw[0] : raw;
      return {
        learnerId: a.learner_id,
        name: p?.full_name ?? "Unknown",
        email: p?.email ?? "",
        isActive: p?.is_active ?? false,
        assignedAt: a.assigned_at,
        completedCourses: (done ?? []).filter((d) => d.learner_id === a.learner_id).length,
      };
    })
    .sort((x, y) => x.name.localeCompare(y.name));
  return { ...path, members };
}

/** Paths one person is on. */
export async function pathsForPerson(userId: string): Promise<{ id: string; name: string; assignedAt: string }[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("path_assignments")
    .select("path_id, assigned_at, training_paths(name)")
    .eq("learner_id", userId)
    .is("unassigned_at", null);
  if (error) return [];
  return (data ?? []).map((a) => {
    const raw = a.training_paths as unknown as { name: string } | { name: string }[] | null;
    return { id: a.path_id, name: (Array.isArray(raw) ? raw[0]?.name : raw?.name) ?? "Path", assignedAt: a.assigned_at };
  });
}

/** Path names per course, for the Courses list. */
export async function pathNamesByCourse(): Promise<Map<string, string[]>> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("training_path_courses").select("course_id, position, training_paths(name)");
  const map = new Map<string, string[]>();
  if (error) return map;
  for (const row of data ?? []) {
    const raw = row.training_paths as unknown as { name: string } | { name: string }[] | null;
    const name = Array.isArray(raw) ? raw[0]?.name : raw?.name;
    if (!name) continue;
    map.set(row.course_id, [...(map.get(row.course_id) ?? []), `${name} (${row.position})`]);
  }
  return map;
}

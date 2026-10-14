import "server-only";
import { check, createAdminClient } from "@/lib/supabase/admin";
import type { OverviewInput } from "./overview.ts";

// Loads everything the admin overview needs. Callers must run requireAdmin() first.
export async function loadOverviewInput(): Promise<OverviewInput> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 60 * 86_400_000).toISOString();

  const [peopleRes, versionsRes, enrolmentsRes, completionsRes, attemptsRes, videoRes, staffRes] = await Promise.all([
    admin.from("profiles").select("id, full_name, role, is_active, created_at"),
    admin.from("course_versions").select("id, course_id, title, lessons(id, title, position, is_required)"),
    admin.from("enrolments").select("id, learner_id, course_version_id, assigned_at, completed_at").is("unassigned_at", null),
    admin.from("lesson_completions").select("enrolment_id, lesson_id, completed_at").is("revoked_at", null),
    admin.from("quiz_attempts").select("enrolment_id, lesson_id, passed, submitted_at").gte("submitted_at", since),
    admin.from("video_progress").select("enrolment_id, lesson_id, updated_at").gte("updated_at", since),
    admin.rpc("admin_staff_overview"),
  ]);

  const lastSignIn = new Map<string, string | null>();
  if (!staffRes.error && Array.isArray(staffRes.data)) {
    (staffRes.data as { id: string; last_sign_in_at: string | null }[]).forEach((r) => lastSignIn.set(r.id, r.last_sign_in_at));
  }

  type Version = { id: string; course_id: string; title: string; lessons: { id: string; title: string; position: number; is_required: boolean }[] | null };

  return {
    now: new Date(),
    people: check("people", peopleRes).map((p) => ({
      id: p.id,
      name: p.full_name,
      role: p.role,
      isActive: p.is_active,
      lastSignInAt: lastSignIn.get(p.id) ?? null,
      createdAt: p.created_at,
    })),
    courses: (check("courses", versionsRes) as unknown as Version[]).map((v) => ({
      versionId: v.id,
      courseId: v.course_id,
      title: v.title,
      lessons: (v.lessons ?? []).map((l) => ({ id: l.id, title: l.title, position: l.position, isRequired: l.is_required })),
    })),
    enrolments: check("assignments", enrolmentsRes).map((e) => ({
      id: e.id,
      learnerId: e.learner_id,
      versionId: e.course_version_id,
      assignedAt: e.assigned_at,
      completedAt: e.completed_at,
    })),
    completions: check("completions", completionsRes).map((c) => ({ enrolmentId: c.enrolment_id, lessonId: c.lesson_id, completedAt: c.completed_at })),
    attempts: check("quiz attempts", attemptsRes).map((a) => ({ enrolmentId: a.enrolment_id, lessonId: a.lesson_id, passed: a.passed, submittedAt: a.submitted_at })),
    videoActivity: check("video progress", videoRes).map((v) => ({ enrolmentId: v.enrolment_id, lessonId: v.lesson_id, updatedAt: v.updated_at })),
  };
}

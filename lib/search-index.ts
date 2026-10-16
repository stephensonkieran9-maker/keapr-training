import "server-only";
import { requireProfile } from "./auth";
import { loadLearnerProgress } from "./learner-progress";
import { listCourses, listStaff } from "./admin/queries";
import { staticItems, type SearchItem } from "./search.ts";

/** Everything the signed-in person may search: their own courses, lessons
 * and downloads (read through their own session), help topics, and for
 * admins, staff and the course builder. */
export async function buildSearchIndex(): Promise<SearchItem[]> {
  const { profile, supabase } = await requireProfile();
  const isAdmin = profile.role === "admin";
  const progress = await loadLearnerProgress(supabase, profile.id);

  const lessonIds = progress.enrolments.flatMap((e) => e.lessons.map((l) => l.id));
  const [notesRes, resourcesRes] = lessonIds.length
    ? await Promise.all([
        supabase.from("lessons").select("id, notes").in("id", lessonIds),
        supabase.from("lesson_resources").select("id, title, lesson_id").in("lesson_id", lessonIds),
      ])
    : [{ data: [] as { id: string; notes: string | null }[] }, { data: [] as { id: string; title: string; lesson_id: string }[] }];
  const notes = new Map((notesRes.data ?? []).map((n) => [n.id, n.notes ?? ""]));

  const items: SearchItem[] = [];
  const lessonInfo = new Map<string, { title: string; course: string; locked: boolean }>();
  for (const e of progress.enrolments) {
    const steps = progress.computed.stepsByEnrolment.get(e.enrolmentId) ?? [];
    const summary = progress.computed.courses.find((c) => c.enrolmentId === e.enrolmentId);
    items.push({
      kind: "course",
      title: e.title,
      subtitle: summary ? `${summary.lessonsPassed} of ${summary.lessonCount} lessons passed` : undefined,
      href: `/courses/${e.courseId}`,
      text: e.description,
    });
    for (const l of e.lessons) {
      const step = steps.find((s) => s.lessonId === l.id);
      const locked = step?.state === "locked";
      lessonInfo.set(l.id, { title: l.title, course: e.title, locked });
      items.push({
        kind: "lesson",
        title: l.title,
        subtitle: `${locked ? "Locked · " : step?.state === "passed" ? "Passed · " : ""}Lesson ${l.position} · ${e.title}`,
        href: `/lessons/${l.id}`,
        text: [l.objectives.join(". "), notes.get(l.id) ?? ""].filter(Boolean).join(". "),
        locked,
      });
    }
  }
  for (const r of resourcesRes.data ?? []) {
    const l = lessonInfo.get(r.lesson_id);
    items.push({ kind: "resource", title: r.title, subtitle: l ? `${l.title} · ${l.course}` : undefined, href: `/lessons/${r.lesson_id}`, locked: l?.locked });
  }

  if (isAdmin) {
    const [staff, courses] = await Promise.all([listStaff().catch(() => []), listCourses().catch(() => [])]);
    for (const s of staff) {
      items.push({ kind: "person", title: s.fullName, subtitle: `${s.email}${s.status === "deactivated" ? " · deactivated" : s.status === "invited" ? " · invited" : ""}`, href: `/admin/staff/${s.id}` });
    }
    for (const c of courses) {
      if (c.archivedAt) continue;
      items.push({
        kind: "admin-course",
        title: c.title,
        subtitle: c.latestVersion ? `Published v${c.latestVersion} · ${c.assignedCount} assigned` : "Draft",
        href: `/admin/courses/${c.id}`,
        text: c.description,
      });
    }
  }

  return [...items, ...staticItems(isAdmin)];
}

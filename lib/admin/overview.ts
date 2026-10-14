// Admin overview: pure computation from raw rows, so it can be tested and
// fed with sample data for the public demo. No database code here.

export type EnrolmentState = "not_started" | "in_progress" | "completed";

export interface OverviewInput {
  now: Date;
  people: { id: string; name: string; role: "learner" | "admin"; isActive: boolean; lastSignInAt: string | null; createdAt: string }[];
  courses: { versionId: string; courseId: string; title: string; lessons: { id: string; title: string; position: number; isRequired: boolean }[] }[];
  enrolments: { id: string; learnerId: string; versionId: string; assignedAt: string; completedAt: string | null }[];
  completions: { enrolmentId: string; lessonId: string; completedAt: string }[];
  attempts: { enrolmentId: string; lessonId: string; passed: boolean; submittedAt: string }[];
  videoActivity: { enrolmentId: string; lessonId: string; updatedAt: string }[];
}

export interface CourseBreakdown {
  courseId: string;
  title: string;
  notStarted: number;
  inProgress: number;
  completed: number;
  total: number;
}

export interface MatrixCell {
  enrolmentId: string;
  state: EnrolmentState;
  passed: number;
  total: number;
  percent: number;
}

export interface StaffRowSnapshot {
  id: string;
  name: string;
  overallPercent: number;
  lastActiveAt: string | null;
  cells: Record<string, MatrixCell | undefined>; // keyed by courseId
}

export interface StuckLesson {
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  attempts: number;
  failed: number;
  firstTimePassRate: number | null; // 0–100
  learnersStuck: number; // failed at least once and not yet passed
}

export interface AttentionItem {
  personId: string;
  name: string;
  reason: string;
  severity: "warning" | "serious";
}

export interface ActivityDay {
  date: string; // YYYY-MM-DD
  passed: number;
  failed: number;
}

export interface Overview {
  kpis: {
    learners: number;
    signedIn: number;
    assignments: number;
    completedAssignments: number;
    completionRate: number; // 0–100
    lessonsPassedThisWeek: number;
    lessonsPassedLastWeek: number;
    firstTimePassRate: number | null; // 0–100
  };
  courses: CourseBreakdown[];
  matrixCourses: { courseId: string; title: string }[];
  staff: StaffRowSnapshot[];
  stuck: StuckLesson[];
  attention: AttentionItem[];
  activity: ActivityDay[];
  hasActivity: boolean;
}

const DAY = 86_400_000;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100));

export function computeOverview(input: OverviewInput): Overview {
  const now = input.now.getTime();
  const versionById = new Map(input.courses.map((c) => [c.versionId, c]));
  const activePeople = input.people.filter((p) => p.isActive);
  const peopleById = new Map(activePeople.map((p) => [p.id, p]));
  const enrolments = input.enrolments.filter((e) => peopleById.has(e.learnerId) && versionById.has(e.versionId));

  const completedSet = new Set(input.completions.map((c) => `${c.enrolmentId}:${c.lessonId}`));
  const attemptsByEnrolment = new Map<string, OverviewInput["attempts"]>();
  input.attempts.forEach((a) => attemptsByEnrolment.set(a.enrolmentId, [...(attemptsByEnrolment.get(a.enrolmentId) ?? []), a]));
  const videoByEnrolment = new Map<string, string[]>();
  input.videoActivity.forEach((v) => videoByEnrolment.set(v.enrolmentId, [...(videoByEnrolment.get(v.enrolmentId) ?? []), v.updatedAt]));

  // Per-enrolment state
  const cellByEnrolment = new Map<string, MatrixCell>();
  const lastActiveByPerson = new Map<string, string>();
  const bump = (personId: string, at: string) => {
    const cur = lastActiveByPerson.get(personId);
    if (!cur || at > cur) lastActiveByPerson.set(personId, at);
  };

  for (const e of enrolments) {
    const course = versionById.get(e.versionId)!;
    const required = course.lessons.filter((l) => l.isRequired);
    const passed = required.filter((l) => completedSet.has(`${e.id}:${l.id}`)).length;
    const attempts = attemptsByEnrolment.get(e.id) ?? [];
    const videos = videoByEnrolment.get(e.id) ?? [];
    const anyActivity = passed > 0 || attempts.length > 0 || videos.length > 0;
    const state: EnrolmentState = e.completedAt || (required.length > 0 && passed === required.length) ? "completed" : anyActivity ? "in_progress" : "not_started";
    cellByEnrolment.set(e.id, { enrolmentId: e.id, state, passed, total: required.length, percent: pct(passed, required.length) });
    attempts.forEach((a) => bump(e.learnerId, a.submittedAt));
    videos.forEach((v) => bump(e.learnerId, v));
  }

  // KPIs
  const learnerIds = new Set(enrolments.map((e) => e.learnerId));
  const cells = [...cellByEnrolment.values()];
  const completedAssignments = cells.filter((c) => c.state === "completed").length;
  const weekAgo = now - 7 * DAY;
  const twoWeeksAgo = now - 14 * DAY;
  const liveCompletions = input.completions.filter((c) => cellByEnrolment.has(c.enrolmentId));
  const lessonsPassedThisWeek = liveCompletions.filter((c) => new Date(c.completedAt).getTime() >= weekAgo).length;
  const lessonsPassedLastWeek = liveCompletions.filter((c) => {
    const t = new Date(c.completedAt).getTime();
    return t >= twoWeeksAgo && t < weekAgo;
  }).length;

  // First attempts per enrolment+lesson
  const sortedAttempts = [...input.attempts].filter((a) => cellByEnrolment.has(a.enrolmentId)).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  const firstAttempt = new Map<string, boolean>();
  sortedAttempts.forEach((a) => {
    const k = `${a.enrolmentId}:${a.lessonId}`;
    if (!firstAttempt.has(k)) firstAttempt.set(k, a.passed);
  });
  const firstAttempts = [...firstAttempt.values()];
  const firstTimePassRate = firstAttempts.length ? pct(firstAttempts.filter(Boolean).length, firstAttempts.length) : null;

  // Course breakdown
  const courseMap = new Map<string, CourseBreakdown>();
  for (const e of enrolments) {
    const course = versionById.get(e.versionId)!;
    const b = courseMap.get(course.courseId) ?? { courseId: course.courseId, title: course.title, notStarted: 0, inProgress: 0, completed: 0, total: 0 };
    const state = cellByEnrolment.get(e.id)!.state;
    if (state === "completed") b.completed++;
    else if (state === "in_progress") b.inProgress++;
    else b.notStarted++;
    b.total++;
    courseMap.set(course.courseId, b);
  }
  const courses = [...courseMap.values()].sort((a, b) => b.total - a.total || a.title.localeCompare(b.title));

  // Staff × course matrix
  const matrixCourses = courses.map((c) => ({ courseId: c.courseId, title: c.title }));
  const staff: StaffRowSnapshot[] = [...learnerIds]
    .map((id) => {
      const person = peopleById.get(id)!;
      const mine = enrolments.filter((e) => e.learnerId === id);
      const row: StaffRowSnapshot["cells"] = {};
      let passed = 0;
      let total = 0;
      mine.forEach((e) => {
        const cell = cellByEnrolment.get(e.id)!;
        row[versionById.get(e.versionId)!.courseId] = cell;
        passed += cell.passed;
        total += cell.total;
      });
      return { id, name: person.name, overallPercent: pct(passed, total), lastActiveAt: lastActiveByPerson.get(id) ?? null, cells: row };
    })
    .sort((a, b) => b.overallPercent - a.overallPercent || a.name.localeCompare(b.name));

  // Lessons where people struggle
  const lessonInfo = new Map<string, { title: string; courseTitle: string }>();
  input.courses.forEach((c) => c.lessons.forEach((l) => lessonInfo.set(l.id, { title: l.title, courseTitle: c.title })));
  const byLesson = new Map<string, { attempts: number; failed: number; firstPass: number; firstTotal: number; stuck: Set<string> }>();
  sortedAttempts.forEach((a) => {
    const s = byLesson.get(a.lessonId) ?? { attempts: 0, failed: 0, firstPass: 0, firstTotal: 0, stuck: new Set<string>() };
    s.attempts++;
    if (!a.passed) s.failed++;
    byLesson.set(a.lessonId, s);
  });
  firstAttempt.forEach((passedFirst, k) => {
    const [enrolmentId, lessonId] = k.split(":");
    const s = byLesson.get(lessonId)!;
    s.firstTotal++;
    if (passedFirst) s.firstPass++;
    if (!passedFirst && !completedSet.has(`${enrolmentId}:${lessonId}`)) s.stuck.add(enrolmentId);
  });
  const stuck: StuckLesson[] = [...byLesson.entries()]
    .filter(([, s]) => s.failed > 0)
    .map(([lessonId, s]) => ({
      lessonId,
      lessonTitle: lessonInfo.get(lessonId)?.title ?? "Lesson",
      courseTitle: lessonInfo.get(lessonId)?.courseTitle ?? "",
      attempts: s.attempts,
      failed: s.failed,
      firstTimePassRate: s.firstTotal ? pct(s.firstPass, s.firstTotal) : null,
      learnersStuck: s.stuck.size,
    }))
    .sort((a, b) => b.failed - a.failed || b.learnersStuck - a.learnersStuck)
    .slice(0, 6);

  // Needs attention
  const attention: AttentionItem[] = [];
  for (const p of activePeople) {
    const mine = enrolments.filter((e) => e.learnerId === p.id);
    if (!p.lastSignInAt && now - new Date(p.createdAt).getTime() > 3 * DAY) {
      attention.push({ personId: p.id, name: p.name, reason: "Invited over 3 days ago and hasn't signed in", severity: "warning" });
      continue;
    }
    const open = mine.filter((e) => cellByEnrolment.get(e.id)!.state !== "completed");
    if (open.length === 0) continue;
    const repeatedFails = new Map<string, number>();
    (mine.flatMap((e) => attemptsByEnrolment.get(e.id) ?? []) as OverviewInput["attempts"]).forEach((a) => {
      if (!a.passed && !completedSet.has(`${a.enrolmentId}:${a.lessonId}`)) repeatedFails.set(a.lessonId, (repeatedFails.get(a.lessonId) ?? 0) + 1);
    });
    const worst = [...repeatedFails.entries()].sort((a, b) => b[1] - a[1])[0];
    if (worst && worst[1] >= 3) {
      attention.push({ personId: p.id, name: p.name, reason: `Failed "${lessonInfo.get(worst[0])?.title ?? "a lesson"}" ${worst[1]} times`, severity: "serious" });
      continue;
    }
    const last = lastActiveByPerson.get(p.id);
    const oldestAssigned = Math.min(...open.map((e) => new Date(e.assignedAt).getTime()));
    const idleSince = last ? new Date(last).getTime() : oldestAssigned;
    const idleDays = Math.floor((now - idleSince) / DAY);
    if (idleDays >= 7) {
      attention.push({ personId: p.id, name: p.name, reason: last ? `No training activity for ${idleDays} days` : `Hasn't started training assigned ${idleDays} days ago`, severity: "warning" });
    }
  }
  attention.sort((a, b) => (a.severity === b.severity ? a.name.localeCompare(b.name) : a.severity === "serious" ? -1 : 1));

  // Activity: last 30 days of quiz attempts
  const activity: ActivityDay[] = [];
  const start = new Date(isoDay(new Date(now - 29 * DAY)) + "T00:00:00Z").getTime();
  for (let i = 0; i < 30; i++) activity.push({ date: isoDay(new Date(start + i * DAY)), passed: 0, failed: 0 });
  const dayIndex = new Map(activity.map((d, i) => [d.date, i]));
  sortedAttempts.forEach((a) => {
    const i = dayIndex.get(a.submittedAt.slice(0, 10));
    if (i === undefined) return;
    if (a.passed) activity[i].passed++;
    else activity[i].failed++;
  });

  return {
    kpis: {
      learners: learnerIds.size,
      signedIn: [...learnerIds].filter((id) => peopleById.get(id)?.lastSignInAt).length,
      assignments: cells.length,
      completedAssignments,
      completionRate: pct(completedAssignments, cells.length),
      lessonsPassedThisWeek,
      lessonsPassedLastWeek,
      firstTimePassRate,
    },
    courses,
    matrixCourses,
    staff,
    stuck,
    attention,
    activity,
    hasActivity: input.attempts.length > 0 || input.completions.length > 0 || input.videoActivity.length > 0,
  };
}

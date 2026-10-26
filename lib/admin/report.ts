// Admin reporting: one row per person per assigned course, with filters and
// CSV export. Pure computation from raw rows, covered by tests.

export type ReportStatus = "not_started" | "in_progress" | "completed";

export interface ReportInput {
  people: { id: string; name: string; email: string; isActive: boolean }[];
  courses: { versionId: string; courseId: string; title: string; version: number; lessons: { id: string; title: string; position: number; isRequired: boolean }[] }[];
  enrolments: { id: string; learnerId: string; versionId: string; assignedAt: string; completedAt: string | null }[];
  completions: { enrolmentId: string; lessonId: string; completedAt: string }[];
  attempts: {
    enrolmentId: string; lessonId: string; correct: number; total: number; passRatio: number; passed: boolean; submittedAt: string;
    /** Optional detail for the attempts export. */
    startedAt?: string | null;
    answers?: Record<string, string>;
  }[];
  /** Correct answers by question, for listing wrong questions (optional). */
  answerKeys?: { lessonId: string; questionId: string; position: number; correctOptionId: string }[];
  videoActivity: { enrolmentId: string; updatedAt: string }[];
  /** Training paths, for the path filter (optional). */
  paths?: { id: string; name: string; courseIds: string[]; memberIds: string[] }[];
}

export interface ReportRow {
  enrolmentId: string;
  personId: string;
  name: string;
  email: string;
  isActive: boolean;
  courseId: string;
  courseTitle: string;
  version: number;
  status: ReportStatus;
  lessonsPassed: number;
  lessonsRequired: number;
  percent: number;
  attempts: number;
  failedAttempts: number;
  assignedAt: string;
  lastActivityAt: string | null;
  completedAt: string | null;
}

export interface AttemptRow {
  name: string;
  email: string;
  courseTitle: string;
  version: number;
  lessonPosition: number;
  lessonTitle: string;
  attemptNumber: number;
  correct: number;
  total: number;
  scorePercent: number;
  passMarkPercent: number;
  passed: boolean;
  submittedAt: string;
  durationSeconds: number | null;
  /** e.g. "Q2, Q5". Empty when all correct or not known. */
  wrongQuestions: string;
}

export interface ReportFilters {
  q?: string;
  course?: string; // courseId
  status?: ReportStatus | "";
  inactive?: boolean; // include deactivated people
  path?: string; // path id: people on the path, courses in the path
}

const latest = (a: string | null, b: string | null) => (!a ? b : !b ? a : a > b ? a : b);

export function buildReport(input: ReportInput): ReportRow[] {
  const people = new Map(input.people.map((p) => [p.id, p]));
  const courses = new Map(input.courses.map((c) => [c.versionId, c]));
  const completed = new Map<string, Set<string>>();
  const lastDone = new Map<string, string>();
  input.completions.forEach((c) => {
    if (!completed.has(c.enrolmentId)) completed.set(c.enrolmentId, new Set());
    completed.get(c.enrolmentId)!.add(c.lessonId);
    lastDone.set(c.enrolmentId, latest(lastDone.get(c.enrolmentId) ?? null, c.completedAt)!);
  });
  const attempts = new Map<string, { n: number; failed: number; last: string | null }>();
  input.attempts.forEach((a) => {
    const s = attempts.get(a.enrolmentId) ?? { n: 0, failed: 0, last: null };
    s.n += 1;
    if (!a.passed) s.failed += 1;
    s.last = latest(s.last, a.submittedAt);
    attempts.set(a.enrolmentId, s);
  });
  const watched = new Map<string, string>();
  input.videoActivity.forEach((v) => watched.set(v.enrolmentId, latest(watched.get(v.enrolmentId) ?? null, v.updatedAt)!));

  const rows: ReportRow[] = [];
  for (const e of input.enrolments) {
    const person = people.get(e.learnerId);
    const course = courses.get(e.versionId);
    if (!person || !course) continue;
    const required = course.lessons.filter((l) => l.isRequired);
    const done = completed.get(e.id) ?? new Set<string>();
    const passed = required.filter((l) => done.has(l.id)).length;
    const a = attempts.get(e.id);
    const lastActivityAt = latest(latest(a?.last ?? null, watched.get(e.id) ?? null), lastDone.get(e.id) ?? null);
    const status: ReportStatus = e.completedAt ? "completed" : passed > 0 || lastActivityAt ? "in_progress" : "not_started";
    rows.push({
      enrolmentId: e.id,
      personId: person.id,
      name: person.name,
      email: person.email,
      isActive: person.isActive,
      courseId: course.courseId,
      courseTitle: course.title,
      version: course.version,
      status,
      lessonsPassed: passed,
      lessonsRequired: required.length,
      percent: required.length ? Math.floor((passed / required.length) * 100) : 0,
      attempts: a?.n ?? 0,
      failedAttempts: a?.failed ?? 0,
      assignedAt: e.assignedAt,
      lastActivityAt,
      completedAt: e.completedAt,
    });
  }
  return rows.sort((x, y) => x.name.localeCompare(y.name) || x.courseTitle.localeCompare(y.courseTitle));
}

export function filterReport(rows: ReportRow[], f: ReportFilters, paths: ReportInput["paths"] = []): ReportRow[] {
  const q = (f.q ?? "").trim().toLowerCase();
  const path = f.path ? paths?.find((p) => p.id === f.path) : undefined;
  return rows.filter(
    (r) =>
      (!f.path || (path !== undefined && path.memberIds.includes(r.personId) && path.courseIds.includes(r.courseId))) &&
      (f.inactive || r.isActive) &&
      (!f.course || r.courseId === f.course) &&
      (!f.status || r.status === f.status) &&
      (!q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)),
  );
}

/** Every quiz attempt for the given assignments, oldest first per lesson. */
export function buildAttempts(input: ReportInput, enrolmentIds: Set<string>): AttemptRow[] {
  const people = new Map(input.people.map((p) => [p.id, p]));
  const courses = new Map(input.courses.map((c) => [c.versionId, c]));
  const enrolments = new Map(input.enrolments.map((e) => [e.id, e]));
  const counter = new Map<string, number>();
  const keysByLesson = new Map<string, { questionId: string; position: number; correctOptionId: string }[]>();
  (input.answerKeys ?? []).forEach((k) => keysByLesson.set(k.lessonId, [...(keysByLesson.get(k.lessonId) ?? []), k]));
  return input.attempts
    .filter((a) => enrolmentIds.has(a.enrolmentId))
    .sort((x, y) => x.submittedAt.localeCompare(y.submittedAt))
    .flatMap((a) => {
      const e = enrolments.get(a.enrolmentId)!;
      const person = people.get(e.learnerId);
      const course = courses.get(e.versionId);
      const lesson = course?.lessons.find((l) => l.id === a.lessonId);
      if (!person || !course || !lesson) return [];
      const k = `${a.enrolmentId}:${a.lessonId}`;
      const n = (counter.get(k) ?? 0) + 1;
      counter.set(k, n);
      return [{
        name: person.name,
        email: person.email,
        courseTitle: course.title,
        version: course.version,
        lessonPosition: lesson.position,
        lessonTitle: lesson.title,
        attemptNumber: n,
        correct: a.correct,
        total: a.total,
        scorePercent: Math.floor((a.correct / a.total) * 100),
        passMarkPercent: Math.round(a.passRatio * 100),
        passed: a.passed,
        submittedAt: a.submittedAt,
        durationSeconds: a.startedAt ? Math.max(0, Math.round((Date.parse(a.submittedAt) - Date.parse(a.startedAt)) / 1000)) : null,
        wrongQuestions: a.answers
          ? (keysByLesson.get(a.lessonId) ?? [])
              .filter((k) => a.answers![k.questionId] !== k.correctOptionId)
              .sort((x, y) => x.position - y.position)
              .map((k) => `Q${k.position}`)
              .join(", ")
          : "",
      }];
    })
    .sort((x, y) => x.name.localeCompare(y.name) || x.courseTitle.localeCompare(y.courseTitle) || x.lessonPosition - y.lessonPosition || x.attemptNumber - y.attemptNumber);
}

export const statusLabel: Record<ReportStatus, string> = { not_started: "Not started", in_progress: "In progress", completed: "Completed" };

/** RFC 4180 CSV. Cells starting with = + - @ are prefixed with ' so
 * spreadsheet apps don't run them as formulas. */
export function toCsv(header: string[], rows: (string | number | boolean | null)[][]): string {
  const cell = (v: string | number | boolean | null) => {
    let s = v === null ? "" : String(v);
    if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const stamp = (iso: string) => iso.slice(0, 16).replace("T", " ");

export function reportCsv(rows: ReportRow[]): string {
  return toCsv(
    ["Name", "Email", "Account", "Course", "Version", "Status", "Lessons passed", "Required lessons", "Progress %", "Quiz attempts", "Failed attempts", "Assigned", "Last activity", "Completed"],
    rows.map((r) => [
      r.name, r.email, r.isActive ? "Active" : "Deactivated", r.courseTitle, r.version, statusLabel[r.status], r.lessonsPassed, r.lessonsRequired,
      r.percent, r.attempts, r.failedAttempts, day(r.assignedAt), day(r.lastActivityAt), day(r.completedAt),
    ]),
  );
}

export function attemptsCsv(rows: AttemptRow[]): string {
  return toCsv(
    ["Name", "Email", "Course", "Version", "Lesson", "Lesson title", "Attempt", "Correct", "Questions", "Score %", "Pass mark %", "Result", "Wrong questions", "Time taken (seconds)", "Submitted (UTC)"],
    rows.map((r) => [
      r.name, r.email, r.courseTitle, r.version, r.lessonPosition, r.lessonTitle, r.attemptNumber, r.correct, r.total, r.scorePercent,
      r.passMarkPercent, r.passed ? "Passed" : "Not passed", r.wrongQuestions, r.durationSeconds, stamp(r.submittedAt),
    ]),
  );
}

/** Reads filters from URL search params (page and export share this). */
export function parseFilters(sp: Record<string, string | string[] | undefined>): ReportFilters {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };
  const status = one("status");
  return {
    q: one("q").slice(0, 100),
    course: one("course"),
    status: status === "not_started" || status === "in_progress" || status === "completed" ? status : "",
    inactive: one("inactive") === "1",
    path: one("path"),
  };
}

export function filtersToQuery(f: ReportFilters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.course) p.set("course", f.course);
  if (f.status) p.set("status", f.status);
  if (f.inactive) p.set("inactive", "1");
  if (f.path) p.set("path", f.path);
  const s = p.toString();
  return s ? `?${s}` : "";
}

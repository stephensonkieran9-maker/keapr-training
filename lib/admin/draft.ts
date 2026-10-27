// Course draft shape edited in the admin course builder and stored in
// courses.draft. Pure code: shared by the editor (client) and the server
// actions, and covered by tests.

export interface DraftQuestion {
  key: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/** A file attached to a lesson (stored in the private lesson-files bucket). */
export interface DraftDownload {
  key: string;
  title: string;
  /** Path inside the lesson-files bucket. */
  ref: string;
  sizeBytes: number | null;
  kind: "pdf" | "doc" | "checklist" | "other";
}

export function downloadKind(fileName: string): DraftDownload["kind"] {
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx", "txt", "rtf", "odt", "xls", "xlsx", "csv", "ppt", "pptx"].includes(ext)) return "doc";
  return "other";
}

export type LessonKind = "video" | "reading";

export interface DraftLesson {
  key: string;
  title: string;
  /** "reading" = no video: the learner reads readingBody, confirms, then takes the quiz. */
  kind: LessonKind;
  /** The text a reading lesson shows. Ignored for video lessons. */
  readingBody: string;
  objectives: string[];
  notes: string;
  videoRef: string;
  videoSeconds: number;
  passPercent: number;
  requiredWatchPercent: number;
  isRequired: boolean;
  estimatedMinutes: number | null;
  /** false = watch-only: the lesson completes once the video has been watched. */
  hasQuiz: boolean;
  questions: DraftQuestion[];
  downloads: DraftDownload[];
}

export interface CourseDraft {
  lessons: DraftLesson[];
}

export const DEFAULT_PASS_PERCENT = 80;
export const DEFAULT_WATCH_PERCENT = 90;

let counter = 0;
export function newKey(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

export function emptyQuestion(): DraftQuestion {
  return { key: newKey("q"), prompt: "", options: ["", "", ""], correctIndex: 0, explanation: "" };
}

export function emptyLesson(): DraftLesson {
  return {
    key: newKey("l"),
    title: "",
    kind: "video",
    readingBody: "",
    objectives: [],
    notes: "",
    videoRef: "",
    videoSeconds: 0,
    passPercent: DEFAULT_PASS_PERCENT,
    requiredWatchPercent: DEFAULT_WATCH_PERCENT,
    isRequired: true,
    estimatedMinutes: null,
    hasQuiz: true,
    questions: [emptyQuestion()],
    downloads: [],
  };
}

/** Coerces stored JSON (possibly old or partial) into a valid draft shape. */
export function normaliseDraft(raw: unknown): CourseDraft {
  const lessons = Array.isArray((raw as CourseDraft | null)?.lessons) ? (raw as CourseDraft).lessons : [];
  return {
    lessons: lessons.map((l) => ({
      key: typeof l.key === "string" && l.key ? l.key : newKey("l"),
      title: String(l.title ?? ""),
      kind: l.kind === "reading" ? "reading" : "video",
      readingBody: String(l.readingBody ?? ""),
      objectives: Array.isArray(l.objectives) ? l.objectives.map(String) : [],
      notes: String(l.notes ?? ""),
      videoRef: String(l.videoRef ?? ""),
      videoSeconds: Number.isFinite(Number(l.videoSeconds)) ? Math.max(0, Math.round(Number(l.videoSeconds))) : 0,
      passPercent: clampPercent(l.passPercent, DEFAULT_PASS_PERCENT),
      requiredWatchPercent: clampPercent(l.requiredWatchPercent, DEFAULT_WATCH_PERCENT),
      isRequired: l.isRequired !== false,
      hasQuiz: l.hasQuiz !== false,
      downloads: (Array.isArray(l.downloads) ? l.downloads : [])
        .filter((f) => f && typeof f.ref === "string" && f.ref)
        .map((f) => ({
          key: typeof f.key === "string" && f.key ? f.key : newKey("f"),
          title: String(f.title ?? "").slice(0, 120),
          ref: String(f.ref),
          sizeBytes: Number.isFinite(Number(f.sizeBytes)) && f.sizeBytes !== null ? Number(f.sizeBytes) : null,
          kind: (["pdf", "doc", "checklist", "other"] as const).includes(f.kind) ? f.kind : "other",
        })),
      estimatedMinutes: l.estimatedMinutes == null || l.estimatedMinutes === ("" as unknown) ? null : Math.max(1, Math.round(Number(l.estimatedMinutes))),
      questions: (Array.isArray(l.questions) ? l.questions : []).map((q) => {
        const options = Array.isArray(q.options) ? q.options.map(String) : [];
        const ci = Math.round(Number(q.correctIndex));
        return {
          key: typeof q.key === "string" && q.key ? q.key : newKey("q"),
          prompt: String(q.prompt ?? ""),
          options,
          correctIndex: Number.isFinite(ci) && ci >= 0 && ci < options.length ? ci : 0,
          explanation: String(q.explanation ?? ""),
        };
      }),
    })),
  };
}

function clampPercent(v: unknown, fallback: number): number {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 1 && n <= 100 ? n : fallback;
}

/** Removes blank options and objectives, keeping the correct answer pointed at the same text. */
export function cleanDraft(draft: CourseDraft): CourseDraft {
  return {
    lessons: draft.lessons.map((l) => ({
      ...l,
      title: l.title.trim(),
      readingBody: l.readingBody.trim(),
      objectives: l.objectives.map((o) => o.trim()).filter(Boolean),
      downloads: (l.downloads ?? []).map((f) => ({ ...f, title: f.title.trim() || f.ref.split("/").pop()?.replace(/^\d+-/, "") || "Download" })),
      // Watch-only lessons publish with no questions.
      questions: (l.hasQuiz ? l.questions : []).map((q) => {
        const kept = q.options.map((o, i) => ({ text: o.trim(), i })).filter((o) => o.text);
        const newCorrect = kept.findIndex((o) => o.i === q.correctIndex);
        return {
          ...q,
          prompt: q.prompt.trim(),
          explanation: q.explanation.trim(),
          options: kept.map((o) => o.text),
          correctIndex: newCorrect, // -1 if the marked answer was blank
        };
      }),
    })),
  };
}

/** Everything that must be fixed before a draft can be published. Empty = ready. */
export function publishProblems(draft: CourseDraft): string[] {
  const d = cleanDraft(draft);
  const problems: string[] = [];
  if (d.lessons.length === 0) problems.push("Add at least one lesson.");
  d.lessons.forEach((l, li) => {
    const name = `Lesson ${li + 1}`;
    if (!l.title) problems.push(`${name} needs a title.`);
    if (l.kind === "reading") {
      if (!l.readingBody) problems.push(`${name} needs the reading text.`);
      if (!l.estimatedMinutes) problems.push(`${name} needs a reading time (time to complete).`);
    } else if (!(l.videoSeconds > 0)) problems.push(`${name} needs the video length.`);
    if (l.hasQuiz && l.questions.length === 0) problems.push(`${name} needs at least one quiz question, or untick "This lesson has a quiz".`);
    l.questions.forEach((q, qi) => {
      const qn = `${name}, question ${qi + 1}`;
      if (!q.prompt) problems.push(`${qn} needs the question text.`);
      if (q.options.length < 2) problems.push(`${qn} needs at least two answers.`);
      if (q.correctIndex < 0 || q.correctIndex >= q.options.length) problems.push(`${qn} needs a correct answer marked.`);
    });
  });
  return problems;
}

/** "4 of 5" style summary of what the pass mark means for a lesson's quiz. */
export function correctNeeded(questionCount: number, passPercent: number): number {
  // Smallest whole number of correct answers whose exact ratio meets the pass mark.
  return Math.ceil((questionCount * passPercent) / 100 - 1e-9);
}

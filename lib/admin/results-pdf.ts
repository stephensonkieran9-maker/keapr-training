// Training results as a PDF, for sending to a manager for review.
// Pure layout over CourseDetail data (no database access), so it's tested.
// Uses the built-in Helvetica fonts, so text is cleaned to the characters
// those fonts can draw (WinAnsi) before it's written.

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { CourseDetail } from "./attempt-detail.ts";
import { formatDateTime, formatDuration, formatElapsed } from "../format.ts";

export interface ResultsCourse extends CourseDetail {
  courseTitle: string;
  version: number;
  assignedAt: string;
  unassignedAt: string | null;
}

export interface ResultsPdfInput {
  learnerName: string;
  learnerEmail?: string;
  courses: ResultsCourse[];
  generatedAt: string;
  generatedBy?: string;
}

const A4: [number, number] = [595.28, 841.89];
const M = 48; // page margin
const GREEN = rgb(0x1f / 255, 0x4a / 255, 0x33 / 255);
const FG = rgb(0x16 / 255, 0x24 / 255, 0x1c / 255);
const MUTED = rgb(0x5b / 255, 0x6b / 255, 0x62 / 255);
const LINE = rgb(0.86, 0.89, 0.87);
const TINT = rgb(0.94, 0.97, 0.95);
const PASS = rgb(0.13, 0.5, 0.29);
const FAIL = rgb(0.7, 0.2, 0.15);

const completedBy = { quiz_pass: "Passed the quiz", watched: "Watched the video", admin_override: "Marked complete by an admin" } as const;

/** Swap characters Helvetica can't draw for close equivalents, drop the rest. */
export function pdfSafe(text: string): string {
  return text
    .replace(/[‘’‛′]/g, "'")
    .replace(/[“”″]/g, '"')
    .replace(/[→⟶]/g, "->")
    .replace(/←/g, "<-")
    .replace(/[✓✔]/g, "Yes")
    .replace(/ | /g, " ")
    .replace(/[\r\t]/g, " ")
    .replace(/\n+/g, " ")
    .replace(/[^\x20-\x7E -ÿ–—•…€£]/g, "");
}

export function resultsFileName(learnerName: string, courseTitle: string | null, date: string): string {
  const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
  return `keapr-training-results-${[slug(learnerName), courseTitle ? slug(courseTitle) : "all-courses", date.slice(0, 10)].filter(Boolean).join("-")}.pdf`;
}

class Writer {
  doc: PDFDocument;
  page!: PDFPage;
  y = 0;
  regular: PDFFont;
  bold: PDFFont;
  constructor(doc: PDFDocument, regular: PDFFont, bold: PDFFont) {
    this.doc = doc;
    this.regular = regular;
    this.bold = bold;
    this.newPage();
  }
  get width() { return A4[0] - M * 2; }
  newPage() {
    this.page = this.doc.addPage(A4);
    this.y = A4[1] - M;
  }
  /** Start a new page if fewer than `h` points remain. */
  need(h: number) {
    if (this.y - h < M + 24) this.newPage();
  }
  wrap(text: string, font: PDFFont, size: number, width: number): string[] {
    const words = pdfSafe(text).split(" ").filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(next, size) <= width) { line = next; continue; }
      if (line) lines.push(line);
      // A single word wider than the column gets cut to fit.
      let word = w;
      while (font.widthOfTextAtSize(word, size) > width && word.length > 1) {
        let cut = word.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(word.slice(0, cut), size) > width) cut--;
        lines.push(word.slice(0, cut));
        word = word.slice(cut);
      }
      line = word;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }
  text(text: string, opts: { x?: number; size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; width?: number; gap?: number } = {}) {
    const size = opts.size ?? 10;
    const font = opts.bold ? this.bold : this.regular;
    const x = opts.x ?? M;
    const lh = size * 1.35;
    for (const l of this.wrap(text, font, size, opts.width ?? this.width - (x - M))) {
      this.need(lh);
      this.page.drawText(l, { x, y: this.y - size, size, font, color: opts.color ?? FG });
      this.y -= lh;
    }
    this.y -= opts.gap ?? 0;
  }
  rule(gap = 8) {
    this.page.drawLine({ start: { x: M, y: this.y }, end: { x: A4[0] - M, y: this.y }, thickness: 0.6, color: LINE });
    this.y -= gap;
  }
}

function summaryRows(c: ResultsCourse): [string, string][] {
  const done = c.lessons.filter((l) => l.completedAt).length;
  return [
    ["Lessons complete", `${done} of ${c.lessons.length}`],
    ["Status", c.completedAt ? `Completed ${formatDateTime(c.completedAt)}` : c.startedAt ? "In progress" : "Not started"],
    ["Assigned", formatDateTime(c.assignedAt) + (c.unassignedAt ? ` (unassigned ${formatDateTime(c.unassignedAt)})` : "")],
    ["Started", c.startedAt ? formatDateTime(c.startedAt) : "Not yet"],
    ["Start to finish", c.elapsedSeconds != null ? formatElapsed(c.elapsedSeconds) : "—"],
    ["Video watched", formatElapsed(c.totalWatchedSeconds)],
    ["Quiz attempts", String(c.totalAttempts)],
    ["Passed first time", c.quizLessons ? `${c.passedFirstTime} of ${c.quizLessons} quizzes` : "No quizzes"],
  ];
}

function drawCourse(w: Writer, c: ResultsCourse) {
  w.need(140);
  // Course heading band
  w.page.drawRectangle({ x: M, y: w.y - 30, width: w.width, height: 30, color: TINT });
  w.page.drawRectangle({ x: M, y: w.y - 30, width: 3, height: 30, color: GREEN });
  const title = w.wrap(c.courseTitle, w.bold, 13, w.width - 120)[0];
  w.page.drawText(title, { x: M + 12, y: w.y - 20, size: 13, font: w.bold, color: GREEN });
  const ver = `Version ${c.version}`;
  w.page.drawText(ver, { x: A4[0] - M - 10 - w.regular.widthOfTextAtSize(ver, 9), y: w.y - 19, size: 9, font: w.regular, color: MUTED });
  w.y -= 42;

  // Summary in two columns
  const rows = summaryRows(c);
  const colW = w.width / 2;
  for (let i = 0; i < rows.length; i += 2) {
    w.need(16);
    rows.slice(i, i + 2).forEach(([k, v], j) => {
      const x = M + j * colW;
      w.page.drawText(k, { x, y: w.y - 9, size: 8.5, font: w.regular, color: MUTED });
      w.page.drawText(w.wrap(v, w.bold, 9.5, colW - 110)[0], { x: x + 100, y: w.y - 9, size: 9.5, font: w.bold, color: FG });
    });
    w.y -= 16;
  }
  w.y -= 6;

  if (c.mostMissed.length) {
    w.need(40);
    w.text("Questions they found hardest", { size: 10.5, bold: true, color: GREEN, gap: 2 });
    for (const m of c.mostMissed.slice(0, 8)) {
      w.text(`${m.misses}x   Lesson ${m.lessonPosition}, Q${m.position}. ${m.prompt}`, { size: 9, x: M + 8, gap: 1 });
    }
    w.y -= 6;
  }

  for (const l of c.lessons) {
    w.need(70);
    w.rule(10);
    const status = l.completedAt ? "Complete" : l.startedAt ? "In progress" : "Not started";
    const sColor = l.completedAt ? PASS : l.startedAt ? MUTED : FAIL;
    const sw = w.bold.widthOfTextAtSize(status, 9);
    for (const [i, line] of w.wrap(`${l.position}. ${l.title}`, w.bold, 11, w.width - sw - 16).entries()) {
      if (i === 0) w.page.drawText(status, { x: A4[0] - M - sw, y: w.y - 11, size: 9, font: w.bold, color: sColor });
      w.page.drawText(line, { x: M, y: w.y - 11, size: 11, font: w.bold, color: FG });
      w.y -= 15;
    }
    w.y -= 2;

    const facts = [
      `Video watched ${formatDuration(l.watchedSeconds)} of ${formatDuration(l.videoSeconds)}`,
      `Started ${l.startedAt ? formatDateTime(l.startedAt) : "—"}`,
      `Completed ${l.completedAt ? `${formatDateTime(l.completedAt)}${l.completedBy ? ` (${completedBy[l.completedBy]})` : ""}` : "—"}`,
      `Time to complete ${l.timeToCompleteSeconds != null ? formatElapsed(l.timeToCompleteSeconds) : "—"}`,
    ];
    w.text(facts.join("   •   "), { size: 8.5, color: MUTED, gap: 2 });
    if (l.overrideReason) w.text(`Override reason: ${l.overrideReason}`, { size: 8.5, color: MUTED, gap: 2 });

    if (!l.hasQuiz) {
      w.text("No quiz: this lesson completes when the video is watched.", { size: 9, color: MUTED, gap: 4 });
      continue;
    }
    if (!l.attempts.length) {
      w.text("No quiz attempts yet.", { size: 9, color: MUTED, gap: 4 });
      continue;
    }

    // Attempts table
    const cols = [
      { h: "Attempt", x: 0 },
      { h: "Submitted", x: 50 },
      { h: "Score", x: 150 },
      { h: "Pass mark", x: 230 },
      { h: "Result", x: 295 },
      { h: "Time taken", x: 370 },
      { h: "Got wrong", x: 440 },
    ];
    w.need(34);
    w.y -= 4;
    w.page.drawRectangle({ x: M, y: w.y - 14, width: w.width, height: 14, color: TINT });
    cols.forEach((col) => w.page.drawText(col.h, { x: M + 4 + col.x, y: w.y - 10, size: 8, font: w.bold, color: MUTED }));
    w.y -= 18;
    for (const a of l.attempts) {
      w.need(14 + a.wrong.length * 22);
      const cells = [
        `#${a.number}`,
        formatDateTime(a.submittedAt),
        `${a.correct}/${a.total} (${a.percent}%)`,
        `${a.passMarkPercent}%`,
        a.passed ? "Passed" : "Not passed",
        a.durationSeconds != null ? formatElapsed(a.durationSeconds) : "Not recorded",
        a.wrong.length ? `${a.wrong.length} question${a.wrong.length === 1 ? "" : "s"}` : "None",
      ];
      cells.forEach((v, i) =>
        w.page.drawText(pdfSafe(v), {
          x: M + 4 + cols[i].x,
          y: w.y - 9,
          size: 8.5,
          font: i === 4 ? w.bold : w.regular,
          color: i === 4 ? (a.passed ? PASS : FAIL) : FG,
        }),
      );
      w.y -= 14;
      for (const wr of a.wrong) {
        w.text(`Q${wr.position}. ${wr.prompt}`, { x: M + 54, size: 8.5, gap: 0 });
        w.text(`Their answer: ${wr.chosen ?? "—"}   •   Correct: ${wr.correct ?? "—"}`, { x: M + 66, size: 8, color: MUTED, gap: 3 });
      }
    }
    w.y -= 6;
  }
  w.y -= 14;
}

export async function buildResultsPdf(input: ResultsPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const one = input.courses.length === 1 ? input.courses[0].courseTitle : null;
  doc.setTitle(pdfSafe(`Training results – ${input.learnerName}${one ? ` – ${one}` : ""}`));
  doc.setAuthor("Keapr Training");
  doc.setCreator("Keapr Training");
  doc.setCreationDate(new Date(input.generatedAt));

  const w = new Writer(doc, await doc.embedFont(StandardFonts.Helvetica), await doc.embedFont(StandardFonts.HelveticaBold));

  // Header
  w.page.drawRectangle({ x: 0, y: A4[1] - 92, width: A4[0], height: 92, color: GREEN });
  w.page.drawText("Keapr Training", { x: M, y: A4[1] - 40, size: 11, font: w.bold, color: rgb(0.78, 0.9, 0.83) });
  w.page.drawText("Training results", { x: M, y: A4[1] - 68, size: 22, font: w.bold, color: rgb(1, 1, 1) });
  w.y = A4[1] - 92 - 24;

  w.text(input.learnerName, { size: 16, bold: true, gap: 2 });
  if (input.learnerEmail) w.text(input.learnerEmail, { size: 9.5, color: MUTED, gap: 2 });
  w.text(
    `Generated ${formatDateTime(input.generatedAt)}${input.generatedBy ? ` by ${input.generatedBy}` : ""} • ${input.courses.length} course${input.courses.length === 1 ? "" : "s"}`,
    { size: 9, color: MUTED, gap: 14 },
  );

  if (input.courses.length > 1) {
    w.text("Overview", { size: 10.5, bold: true, color: GREEN, gap: 4 });
    for (const c of input.courses) {
      const done = c.lessons.filter((l) => l.completedAt).length;
      const st = c.completedAt ? `Completed ${formatDateTime(c.completedAt)}` : c.startedAt ? "In progress" : "Not started";
      w.need(14);
      const t = w.wrap(c.courseTitle, w.regular, 9.5, 260)[0];
      w.page.drawText(t, { x: M, y: w.y - 10, size: 9.5, font: w.regular, color: FG });
      w.page.drawText(`${done}/${c.lessons.length} lessons`, { x: M + 280, y: w.y - 10, size: 9.5, font: w.regular, color: MUTED });
      w.page.drawText(pdfSafe(st), { x: M + 360, y: w.y - 10, size: 9.5, font: w.bold, color: c.completedAt ? PASS : FG });
      w.y -= 15;
    }
    w.y -= 14;
  }

  if (!input.courses.length) w.text("No courses assigned.", { size: 10, color: MUTED });
  input.courses.forEach((c) => drawCourse(w, c));

  w.need(30);
  w.text("Times are UK time. Quiz time taken starts from the first answer picked. Lessons and attempts from before timings were recorded show “—” or “Not recorded”. Video watch time is a training gate, not proof of attention.", { size: 7.5, color: MUTED });

  // Footer on every page
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    const left = pdfSafe(`${input.learnerName} • Keapr Training • Internal – confidential`);
    p.drawText(left, { x: M, y: 26, size: 7.5, font: w.regular, color: MUTED });
    const right = `Page ${i + 1} of ${pages.length}`;
    p.drawText(right, { x: A4[0] - M - w.regular.widthOfTextAtSize(right, 7.5), y: 26, size: 7.5, font: w.regular, color: MUTED });
  });

  return doc.save();
}

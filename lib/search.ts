// Search across what the signed-in person can see. The server builds the
// index (only their own courses, plus staff and courses for admins); the
// browser filters it as they type. Pure, so it's tested and runs anywhere.

import { faqId, faqs, adminTopics } from "./help-content.ts";

export type SearchKind = "page" | "course" | "lesson" | "resource" | "help" | "person" | "admin-course";

export interface SearchItem {
  kind: SearchKind;
  title: string;
  subtitle?: string;
  href: string;
  /** Extra searchable text (objectives, notes, answers). Not shown in full. */
  text?: string;
  locked?: boolean;
}

export interface SearchHit extends SearchItem {
  score: number;
  snippet?: string;
}

export const kindLabel: Record<SearchKind, string> = {
  page: "Pages",
  course: "Your courses",
  lesson: "Lessons",
  resource: "Downloads",
  help: "Help",
  person: "Staff",
  "admin-course": "Course builder",
};

// Order groups appear in.
export const kindOrder: SearchKind[] = ["course", "lesson", "resource", "help", "person", "admin-course", "page"];

const kindBoost: Record<SearchKind, number> = { course: 6, lesson: 5, resource: 4, person: 4, "admin-course": 3, help: 2, page: 1 };

/** Lowercase and strip accents so "cafe" finds "Café". */
export function normalise(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function tokens(q: string): string[] {
  return normalise(q).split(/[^a-z0-9£%]+/).filter(Boolean);
}

/** A short piece of the extra text around the first match. */
export function snippetFor(text: string, terms: string[], width = 90): string | undefined {
  const n = normalise(text);
  let at = -1;
  for (const t of terms) {
    const i = n.indexOf(t);
    if (i >= 0 && (at < 0 || i < at)) at = i;
  }
  if (at < 0) return undefined;
  let start = Math.max(0, at - Math.floor(width / 3));
  // Start on a whole word.
  if (start > 0) {
    const space = text.lastIndexOf(" ", start);
    start = space >= 0 && at - space < width / 2 ? space + 1 : start;
  }
  const end = Math.min(text.length, start + width);
  return (start > 0 ? "…" : "") + text.slice(start, end).trim() + (end < text.length ? "…" : "");
}

/** Every word of the query must appear somewhere in the item. Title matches rank highest. */
export function search(items: SearchItem[], query: string, limit = 50): SearchHit[] {
  const terms = tokens(query);
  if (!terms.length) return [];
  const phrase = normalise(query.trim());
  const hits: SearchHit[] = [];

  for (const item of items) {
    const title = normalise(item.title);
    const sub = normalise(item.subtitle ?? "");
    const text = normalise(item.text ?? "");
    const all = `${title} ${sub} ${text}`;
    if (!terms.every((t) => all.includes(t))) continue;

    let score = kindBoost[item.kind];
    if (title === phrase) score += 120;
    else if (title.startsWith(phrase)) score += 90;
    else if (title.includes(phrase)) score += 70;
    const inTitle = terms.filter((t) => title.includes(t)).length;
    score += inTitle * 15;
    score += terms.filter((t) => new RegExp(`(^|[^a-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(title)).length * 8; // word starts
    score += terms.filter((t) => sub.includes(t)).length * 5;
    if (item.locked) score -= 3;

    const needsSnippet = inTitle < terms.length && item.text;
    hits.push({ ...item, score, snippet: needsSnippet ? snippetFor(item.text!, terms) : undefined });
  }

  return hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit);
}

/** Groups hits for display, in kindOrder, best first within each group. */
export function groupHits(hits: SearchHit[]): { kind: SearchKind; label: string; hits: SearchHit[] }[] {
  return kindOrder
    .map((kind) => ({ kind, label: kindLabel[kind], hits: hits.filter((h) => h.kind === kind) }))
    .filter((g) => g.hits.length);
}

/** Help topics and app pages: the same for everyone (admin extras for admins). */
export function staticItems(isAdmin: boolean): SearchItem[] {
  const pages: SearchItem[] = [
    { kind: "page", title: "Dashboard", href: "/dashboard", text: "home next lesson my training" },
    { kind: "page", title: "Help", href: "/help", text: "support faq questions report a problem contact" },
  ];
  if (isAdmin) {
    pages.push(
      { kind: "page", title: "Overview", subtitle: "Admin", href: "/admin", text: "dashboard progress stuck nudge activity" },
      { kind: "page", title: "Staff", subtitle: "Admin", href: "/admin/staff", text: "people team add someone invite" },
      { kind: "page", title: "Courses", subtitle: "Admin", href: "/admin/courses", text: "course builder new course publish" },
      { kind: "page", title: "Reports", subtitle: "Admin", href: "/admin/reports", text: "csv export spreadsheet download progress attempts" },
    );
  }
  const help: SearchItem[] = [...faqs, ...(isAdmin ? adminTopics : [])].map((f) => ({
    kind: "help",
    title: f.q,
    subtitle: "Help",
    href: `/help#${faqId(f.q)}`,
    text: f.a,
  }));
  return [...pages, ...help];
}

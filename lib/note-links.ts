// Pulls web links out of lesson notes so they can be shown as buttons at the
// top of the lesson. The label comes from the text just before the link on
// the same line, or the line above it ("Board in Notion:\nhttps://…").
// Pure, so it's tested.

export interface NoteLink {
  label: string;
  href: string;
}

const URL_RE = /https?:\/\/[^\s<>"]+/g;

export function noteLinks(notes: string | null | undefined): NoteLink[] {
  if (!notes) return [];
  const lines = notes.split(/\r?\n/);
  const out: NoteLink[] = [];
  lines.forEach((line, i) => {
    for (const m of line.matchAll(URL_RE)) {
      const href = m[0].replace(/[.,;:!?)\]]+$/, "");
      let label = line.slice(0, m.index).trim();
      if (!label) {
        for (let j = i - 1; j >= 0; j--) {
          if (lines[j].trim()) {
            label = lines[j].trim();
            break;
          }
        }
        // Don't borrow a whole paragraph as a button label.
        if (label.length > 70 || URL_RE.test(label)) label = "";
        URL_RE.lastIndex = 0;
      }
      label = label.replace(/[:\-–—\s]+$/, "").trim();
      if (!label) {
        try {
          label = new URL(href).hostname.replace(/^www\./, "");
        } catch {
          label = "Open link";
        }
      }
      if (!out.some((l) => l.href === href)) out.push({ label, href });
    }
  });
  return out;
}

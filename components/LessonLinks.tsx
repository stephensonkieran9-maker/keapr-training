import { Icon } from "./Icons";
import { noteLinks } from "@/lib/note-links";

/** Downloads and links from the lesson notes, as buttons at the top of the lesson. */
export function LessonLinks({ notes, downloads = [] }: { notes: string | null; downloads?: { id: string; title: string; href: string | null; sizeLabel?: string }[] }) {
  const links = noteLinks(notes);
  const files = downloads.filter((d) => d.href);
  if (!links.length && !files.length) return null;
  return (
    <div className="lesson-links" aria-label="Downloads and links for this lesson">
      {files.map((d) => (
        <a key={d.id} className="btn btn-primary btn-sm" href={d.href!} download>
          <Icon name="download" />Download {d.title}
          {d.sizeLabel && <span className="lesson-link-meta">{d.sizeLabel}</span>}
        </a>
      ))}
      {links.map((l) => (
        <a key={l.href} className="btn btn-primary btn-sm" href={l.href} target="_blank" rel="noopener noreferrer">
          <Icon name="arrow" />Open {l.label}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ))}
    </div>
  );
}

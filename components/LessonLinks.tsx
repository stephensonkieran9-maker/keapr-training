import { Icon } from "./Icons";
import { noteLinks } from "@/lib/note-links";

/** Links from the lesson notes, as buttons at the top of the lesson. */
export function LessonLinks({ notes }: { notes: string | null }) {
  const links = noteLinks(notes);
  if (!links.length) return null;
  return (
    <div className="lesson-links" aria-label="Links for this lesson">
      {links.map((l) => (
        <a key={l.href} className="btn btn-primary btn-sm" href={l.href} target="_blank" rel="noopener noreferrer">
          <Icon name="arrow" />Open {l.label}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ))}
    </div>
  );
}

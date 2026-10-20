import { Fragment } from "react";

const URL_RE = /(https?:\/\/[^\s<>"]+)/g;

/** Plain text with any http(s) web addresses turned into links that open in
 * a new tab. Used for lesson notes, so admins can paste links straight in. */
export function LinkedText({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
        // Leave trailing punctuation outside the link: "see https://x.com/a." → link + "."
        const m = part.match(/^(.*?)([.,;:!?)\]]*)$/);
        const href = m?.[1] || part;
        const trail = m?.[2] ?? "";
        return (
          <Fragment key={i}>
            <a href={href} target="_blank" rel="noopener noreferrer" className="notes-link">{linkLabel(href)}</a>
            {trail}
          </Fragment>
        );
      })}
    </>
  );
}

/** Shows a short, readable label instead of a long tracking-laden URL. */
function linkLabel(href: string): string {
  try {
    const u = new URL(href);
    const host = u.hostname.replace(/^www\./, "");
    return `${host}${u.pathname.length > 1 ? u.pathname.slice(0, 32) + (u.pathname.length > 32 ? "…" : "") : ""}`;
  } catch {
    return href;
  }
}

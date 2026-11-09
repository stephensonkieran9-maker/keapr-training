import { Fragment, type ReactNode } from "react";

// Renders case-study text written in a small subset of Markdown:
// # / ## / ### headings, paragraphs, - bullets, 1. numbered lists,
// | tables |, > quotes, --- dividers, **bold** and *italic*.
// Text is never treated as HTML, so pasted content can't inject anything.

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(m[1] !== undefined ? <strong key={i++}>{m[1]}</strong> : <em key={i++}>{m[2]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const cells = (line: string) => line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

function blocks(src: string, keyBase = "b"): ReactNode[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let k = 0;
  const key = () => `${keyBase}${k++}`;

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (!t) { i++; continue; }

    if (/^---+$/.test(t)) { out.push(<hr key={key()} />); i++; continue; }

    const h = /^(#{1,3})\s+(.*)$/.exec(t);
    if (h) {
      const level = h[1].length;
      const content = inline(h[2]);
      out.push(level === 1 ? <h2 key={key()} className="cs-h1">{content}</h2> : level === 2 ? <h3 key={key()}>{content}</h3> : <h4 key={key()}>{content}</h4>);
      i++;
      continue;
    }

    if (t.startsWith(">")) {
      const inner: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) inner.push(lines[i++].trim().replace(/^>\s?/, ""));
      out.push(<blockquote key={key()}>{blocks(inner.join("\n"), `${keyBase}q${k}`)}</blockquote>);
      continue;
    }

    if (t.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const r = lines[i++].trim();
        if (!/^\|?\s*:?-{3,}/.test(r)) rows.push(cells(r));
      }
      const [head, ...body] = rows;
      out.push(
        <div className="cs-table" key={key()}>
          <table>
            <thead><tr>{head.map((c, j) => <th key={j}>{inline(c)}</th>)}</tr></thead>
            <tbody>{body.map((r, j) => <tr key={j}>{r.map((c, n) => <td key={n}>{inline(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (/^[-*]\s+/.test(t) || /^\d+\.\s+/.test(t)) {
      const ordered = /^\d+\./.test(t);
      const items: string[] = [];
      while (i < lines.length && (ordered ? /^\d+\.\s+/ : /^[-*]\s+/).test(lines[i].trim())) {
        items.push(lines[i++].trim().replace(/^([-*]|\d+\.)\s+/, ""));
      }
      const lis = items.map((it, j) => <li key={j}>{inline(it)}</li>);
      out.push(ordered ? <ol key={key()}>{lis}</ol> : <ul key={key()}>{lis}</ul>);
      continue;
    }

    const para: string[] = [];
    while (i < lines.length) {
      const p = lines[i].trim();
      if (!p || /^(#{1,3}\s|>|\||[-*]\s|\d+\.\s|---+$)/.test(p)) break;
      para.push(p);
      i++;
    }
    out.push(<p key={key()}>{para.map((p, j) => <Fragment key={j}>{j > 0 && " "}{inline(p)}</Fragment>)}</p>);
  }
  return out;
}

export function CaseStudy({ text, className = "case-study" }: { text: string; className?: string }) {
  return <div className={className}>{blocks(text)}</div>;
}

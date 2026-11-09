"use client";

import { createContext, useContext, useRef, useState } from "react";

/** Where the photo zip comes from, and thumbnails for the property photos
 * (keyed by file hash). Provided by the test screen. */
export const PhotoContext = createContext<{ downloadHref: string | null; urls: Record<string, string> }>({ downloadHref: null, urls: {} });

// Thumbnails for files picked on this device, kept for the page's lifetime.
const localUrls = new Map<string, string>();

async function hashFile(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function PhotosInput({ value, onChange, disabled, label }: { value: string[]; onChange: (v: string[]) => void; disabled?: boolean; label: string }) {
  const { downloadHref, urls } = useContext(PhotoContext);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const add = async (files: FileList | File[]) => {
    const list = [...files].filter((f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(f.name));
    if (!list.length) return;
    setBusy(true);
    const next = [...value];
    let dupes = 0;
    for (const f of list) {
      const h = await hashFile(f);
      if (!localUrls.has(h)) localUrls.set(h, URL.createObjectURL(f));
      if (next.includes(h)) dupes++;
      else if (next.length < 60) next.push(h);
    }
    onChange(next);
    setBusy(false);
    setNote(dupes ? `${dupes} photo${dupes === 1 ? " was" : "s were"} already uploaded.` : `${list.length - dupes} photo${list.length - dupes === 1 ? "" : "s"} added.`);
    if (input.current) input.current.value = "";
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    const next = [...value];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange(next);
    setNote(`Moved photo to position ${to + 1}.`);
  };

  return (
    <div className="ph">
      <div className="ph-actions">
        {downloadHref
          ? <a className="btn btn-ghost btn-sm" href={downloadHref} download>⬇ Download photos (.zip)</a>
          : <span className="hint">Photos haven&apos;t been added to this assessment yet.</span>}
      </div>

      {!disabled && (
        <label
          className={`ph-drop${over ? " over" : ""}`}
          onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setOver(true); } }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { if (e.dataTransfer.files.length) { e.preventDefault(); setOver(false); void add(e.dataTransfer.files); } }}
        >
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => e.target.files && void add(e.target.files)} />
          <strong>{busy ? "Adding photos…" : "Upload photos"}</strong>
          <span>Unzip the download, then choose or drop all the photos here.</span>
        </label>
      )}

      <p className="sr-only" aria-live="polite">{note}</p>

      {value.length > 0 && (
        <ol className="ph-grid" aria-label={`${label}, in listing order`}>
          {value.map((h, i) => {
            const src = urls[h] ?? localUrls.get(h);
            const known = h in urls;
            return (
              <li
                key={h}
                className={`ph-item${dragFrom === i ? " dragging" : ""}${known ? "" : " unknown"}`}
                draggable={!disabled}
                onDragStart={(e) => { setDragFrom(i); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(i)); }}
                onDragEnd={() => setDragFrom(null)}
                onDragOver={(e) => { if (dragFrom !== null) e.preventDefault(); }}
                onDrop={(e) => { if (dragFrom !== null) { e.preventDefault(); move(dragFrom, i); setDragFrom(null); } }}
              >
                <span className="ph-n">{i + 1}</span>
                {src ? <img src={src} alt={`Photo ${i + 1}`} draggable={false} /> : <div className="ph-missing">Photo {i + 1}</div>}
                {!known && <span className="ph-warn">Not one of the property photos. Upload the files exactly as downloaded.</span>}
                {!disabled && (
                  <div className="ph-ctrl">
                    <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move photo ${i + 1} earlier`}>←</button>
                    <button type="button" onClick={() => move(i, i + 1)} disabled={i === value.length - 1} aria-label={`Move photo ${i + 1} later`}>→</button>
                    <button type="button" onClick={() => { onChange(value.filter((x) => x !== h)); setNote(`Removed photo ${i + 1}.`); }} aria-label={`Remove photo ${i + 1}`}>✕</button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

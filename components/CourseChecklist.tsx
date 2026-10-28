"use client";

import { useState, useTransition } from "react";
import { setChecklistTick } from "@/lib/checklist-actions";

export interface ChecklistSectionView {
  title: string;
  items: { id: string; label: string; ticked: boolean }[];
}

/** Learner's course checklist. Ticks save straight away; they're for
 * tracking only and don't lock or unlock lessons. */
export function CourseChecklist({ sections, readOnly = false, preview = false }: { sections: ChecklistSectionView[]; readOnly?: boolean; preview?: boolean }) {
  const [ticked, setTicked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.flatMap((s) => s.items.map((i) => [i.id, i.ticked]))),
  );
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const total = Object.keys(ticked).length;
  const done = Object.values(ticked).filter(Boolean).length;

  function toggle(id: string, value: boolean) {
    setError(null);
    setTicked((t) => ({ ...t, [id]: value }));
    if (preview) return; // admin preview: nothing is saved
    start(async () => {
      const r = await setChecklistTick(id, value);
      if (!r.ok) {
        setTicked((t) => ({ ...t, [id]: !value }));
        setError(r.error ?? "That didn't save.");
      }
    });
  }

  return (
    <div className="checklist">
      <div className="checklist-count" aria-live="polite">{done} of {total} done</div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {sections.map((s, si) => (
        <div key={si} className="checklist-section">
          {s.title && <h3>{s.title}</h3>}
          <ul>
            {s.items.map((i) => (
              <li key={i.id}>
                <label className={`checklist-item${ticked[i.id] ? " done" : ""}`}>
                  <input type="checkbox" checked={Boolean(ticked[i.id])} disabled={readOnly} onChange={(e) => toggle(i.id, e.target.checked)} />
                  <span>{i.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import type { ActionState } from "@/lib/admin/actions";
import { savePathCourses } from "@/lib/admin/path-actions";

interface Course {
  id: string;
  title: string;
  published: boolean;
}

/** Orders a path's courses; each opens only after the ones above it are finished. */
export function PathCourses({ pathId, courses, initial, memberCount }: { pathId: string; courses: Course[]; initial: string[]; memberCount: number }) {
  const [order, setOrder] = useState<string[]>(initial.filter((id) => courses.some((c) => c.id === id)));
  const [saved, setSaved] = useState(initial.join());
  const [adding, setAdding] = useState("");
  const [result, setResult] = useState<ActionState | null>(null);
  const [pending, start] = useTransition();
  const byId = new Map(courses.map((c) => [c.id, c]));
  const outside = courses.filter((c) => !order.includes(c.id));
  const dirty = order.join() !== saved;

  function change(next: string[]) {
    setOrder(next);
    setResult(null);
  }
  function move(i: number, d: -1 | 1) {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    change(next);
  }

  return (
    <div className="form-stack">
      {order.length === 0 ? (
        <p className="muted" style={{ fontSize: 14, margin: 0 }}>No courses yet. Add the first one below.</p>
      ) : (
        <ol className="path-list">
          {order.map((id, i) => {
            const c = byId.get(id);
            return (
              <li key={id}>
                <span className="path-num" aria-hidden="true">{i + 1}</span>
                <span className="path-title">
                  {c?.title}
                  {!c?.published && <small>Draft: assigned automatically once published</small>}
                </span>
                <span className="actions-row">
                  <button type="button" className="mini" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${c?.title} up`}>↑</button>
                  <button type="button" className="mini" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label={`Move ${c?.title} down`}>↓</button>
                  <button type="button" className="mini danger" onClick={() => change(order.filter((x) => x !== id))} aria-label={`Take ${c?.title} out of the path`}>Remove</button>
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {outside.length > 0 && (
        <div className="option-row">
          <select className="input" value={adding} onChange={(e) => setAdding(e.target.value)} aria-label="Course to add">
            <option value="">Add a course…</option>
            {outside.map((c) => <option key={c.id} value={c.id}>{c.title}{c.published ? "" : " (draft)"}</option>)}
          </select>
          <button type="button" className="btn btn-ghost btn-sm" disabled={!adding} onClick={() => { change([...order, adding]); setAdding(""); }}>Add</button>
        </div>
      )}

      {result?.error && <div className="notice error" role="alert">{result.error}</div>}
      {result?.ok && <div className="notice ok" role="status">{result.message}</div>}
      <div className="actions-row">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!dirty || pending}
          onClick={() =>
            start(async () => {
              const r = await savePathCourses(pathId, order);
              setResult(r);
              if (r.ok) setSaved(order.join());
            })
          }
        >
          {pending ? "Saving…" : "Save courses"}
        </button>
        {dirty && <span className="hint">Unsaved changes{memberCount ? `. New courses are assigned to the ${memberCount} ${memberCount === 1 ? "person" : "people"} on this path when you save.` : ""}</span>}
      </div>
    </div>
  );
}

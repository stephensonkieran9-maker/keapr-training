"use client";

import { useState, useTransition } from "react";
import { saveTrainingPath, type ActionState } from "@/lib/admin/actions";

interface Course {
  id: string;
  title: string;
  published: boolean;
}

/** Orders courses so each opens only after the earlier ones are finished. */
export function TrainingPath({ courses, initial }: { courses: Course[]; initial: string[] }) {
  const [order, setOrder] = useState<string[]>(initial.filter((id) => courses.some((c) => c.id === id)));
  const [adding, setAdding] = useState("");
  const [result, setResult] = useState<ActionState | null>(null);
  const [pending, start] = useTransition();
  const byId = new Map(courses.map((c) => [c.id, c]));
  const outside = courses.filter((c) => !order.includes(c.id));
  const dirty = order.join() !== initial.join();

  function move(i: number, d: -1 | 1) {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
    setResult(null);
  }

  return (
    <section className="card" aria-labelledby="path-title">
      <h2 id="path-title" style={{ marginTop: 0 }}>Training path</h2>
      <p className="hint" style={{ marginTop: 0 }}>
        Courses here open in order: each stays locked until the ones above it are finished. Only courses assigned to the person count, so
        someone without course 2 goes straight from 1 to 3. Courses not in the path are always open.
      </p>

      {order.length === 0 ? (
        <p className="muted" style={{ fontSize: 14 }}>No courses in the path yet. Everything is open.</p>
      ) : (
        <ol className="path-list">
          {order.map((id, i) => (
            <li key={id}>
              <span className="path-num" aria-hidden="true">{i + 1}</span>
              <span className="path-title">
                {byId.get(id)?.title}
                {!byId.get(id)?.published && <small>Draft: not assignable yet</small>}
              </span>
              <span className="actions-row">
                <button type="button" className="mini" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${byId.get(id)?.title} up`}>↑</button>
                <button type="button" className="mini" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label={`Move ${byId.get(id)?.title} down`}>↓</button>
                <button type="button" className="mini danger" onClick={() => { setOrder(order.filter((x) => x !== id)); setResult(null); }} aria-label={`Take ${byId.get(id)?.title} out of the path`}>Remove</button>
              </span>
            </li>
          ))}
        </ol>
      )}

      {outside.length > 0 && (
        <div className="option-row" style={{ marginTop: 12 }}>
          <select className="input" value={adding} onChange={(e) => setAdding(e.target.value)} aria-label="Course to add to the path">
            <option value="">Add a course to the path…</option>
            {outside.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={!adding}
            onClick={() => { setOrder([...order, adding]); setAdding(""); setResult(null); }}
          >
            Add
          </button>
        </div>
      )}

      {result?.error && <div className="notice error" role="alert" style={{ marginTop: 12 }}>{result.error}</div>}
      {result?.ok && <div className="notice ok" role="status" style={{ marginTop: 12 }}>{result.message}</div>}
      <div className="actions-row" style={{ marginTop: 12 }}>
        <button type="button" className="btn btn-primary btn-sm" disabled={!dirty || pending} onClick={() => start(async () => setResult(await saveTrainingPath(order)))}>
          {pending ? "Saving…" : "Save order"}
        </button>
        {dirty && <span className="hint">Unsaved changes</span>}
      </div>
    </section>
  );
}

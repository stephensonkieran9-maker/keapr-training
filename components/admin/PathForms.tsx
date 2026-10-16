"use client";

import { useActionState, useMemo, useState } from "react";
import type { ActionState } from "@/lib/admin/actions";
import {
  assignPathToPeople,
  assignPathToPerson,
  createPath,
  deletePath,
  removePathFromPerson,
  updatePathDetails,
} from "@/lib/admin/path-actions";

function Notice({ state }: { state: ActionState }) {
  if (state.error) return <div className="notice error" role="alert">{state.error}</div>;
  if (state.ok && state.message) return <div className="notice ok" role="status">{state.message}</div>;
  return null;
}

export function NewPathForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createPath, {});
  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>New path</h2>
      <p className="hint" style={{ marginTop: 0 }}>For example one per team: &ldquo;Arbitrage team&rdquo;, &ldquo;Operations team&rdquo;. You&apos;ll add courses next.</p>
      <form action={action} className="form-stack">
        <div className="field">
          <label htmlFor="path-name">Name</label>
          <input id="path-name" name="name" required maxLength={120} />
        </div>
        <div className="field">
          <label htmlFor="path-desc">Description (optional)</label>
          <textarea id="path-desc" name="description" rows={2} maxLength={500} />
        </div>
        <Notice state={state} />
        <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Creating…" : "Create path"}</button>
      </form>
    </section>
  );
}

export function PathDetailsForm({ pathId, name, description }: { pathId: string; name: string; description: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updatePathDetails, {});
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="pathId" value={pathId} />
      <div className="field">
        <label htmlFor="pd-name">Name</label>
        <input id="pd-name" name="name" defaultValue={name} required maxLength={120} />
      </div>
      <div className="field">
        <label htmlFor="pd-desc">Description</label>
        <textarea id="pd-desc" name="description" defaultValue={description} rows={2} maxLength={500} />
      </div>
      <Notice state={state} />
      <div className="actions-row"><button className="btn btn-ghost btn-sm" type="submit" disabled={pending}>{pending ? "Saving…" : "Save details"}</button></div>
    </form>
  );
}

/** Tick people to add to a path. */
export function AddPeopleToPath({ pathId, people }: { pathId: string; people: { id: string; name: string; email: string }[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(assignPathToPeople, {});
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? people.filter((p) => p.name.toLowerCase().includes(t) || p.email.toLowerCase().includes(t)) : people;
  }, [people, q]);

  if (!people.length) return <p className="hint" style={{ margin: 0 }}>Everyone active is already on this path.</p>;
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="pathId" value={pathId} />
      {people.length > 6 && <input className="input" type="search" placeholder="Filter by name or email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter people" />}
      <div className="people-picker">
        {shown.map((p) => (
          <label key={p.id} className="check">
            <input type="checkbox" name="userId" value={p.id} />
            <span>{p.name} <small className="muted">{p.email}</small></span>
          </label>
        ))}
        {!shown.length && <p className="hint" style={{ margin: 0 }}>No one matches.</p>}
      </div>
      <Notice state={state} />
      <div className="actions-row"><button className="btn btn-primary btn-sm" type="submit" disabled={pending}>{pending ? "Adding…" : "Add to path"}</button></div>
    </form>
  );
}

/** "Remove" next to a person on a path (path page or Staff page). */
export function RemoveFromPath({ pathId, userId, label }: { pathId: string; userId: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(removePathFromPerson, {});
  if (state.ok) return <span className="hint" role="status">{state.message}</span>;
  if (!open) return <button type="button" className="mini" onClick={() => setOpen(true)}>Remove…</button>;
  return (
    <form action={action} className="form-stack" style={{ gap: 8 }}>
      <input type="hidden" name="pathId" value={pathId} />
      <input type="hidden" name="userId" value={userId} />
      <label className="check" style={{ fontSize: 13 }}>
        <input type="checkbox" name="removeCourses" value="yes" />
        Also unassign its courses (progress kept; courses their other paths need stay)
      </label>
      {state.error && <div className="notice error" role="alert">{state.error}</div>}
      <div className="actions-row">
        <button className="btn btn-danger btn-sm" type="submit" disabled={pending}>{pending ? "Removing…" : `Remove from ${label}`}</button>
        <button type="button" className="mini" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}

/** On a person's Staff page. */
export function AssignPathForm({ userId, options }: { userId: string; options: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(assignPathToPerson, {});
  if (!options.length) return <p className="hint" style={{ margin: 0 }}>They&apos;re on every path, or no paths exist yet.</p>;
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="userId" value={userId} />
      <div className="field">
        <label htmlFor="assign-path">Training path</label>
        <select id="assign-path" name="pathId" defaultValue="">
          <option value="" disabled>Choose a path</option>
          {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      <Notice state={state} />
      <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Assigning…" : "Assign path"}</button>
    </form>
  );
}

export function DeletePathForm({ pathId, name, members }: { pathId: string; name: string; members: number }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(deletePath, {});
  return (
    <section className="card danger-zone">
      <div className="ov-card-head">
        <h2 style={{ margin: 0 }}>Delete this path</h2>
        {!open && <button type="button" className="mini" onClick={() => setOpen(true)}>Show</button>}
      </div>
      {open && (
        <form action={action} className="form-stack" style={{ marginTop: 12 }}>
          <input type="hidden" name="pathId" value={pathId} />
          <p className="hint" style={{ margin: 0 }}>
            {members ? `The ${members} ${members === 1 ? "person" : "people"} on it keep the courses it gave them and all their progress; ` : ""}
            the courses just stop opening in this order. The courses themselves aren&apos;t affected.
          </p>
          <label className="check"><input type="checkbox" name="confirm" value="yes" required />Delete &ldquo;{name}&rdquo;</label>
          {state.error && <div className="notice error" role="alert">{state.error}</div>}
          <div className="actions-row">
            <button className="btn btn-danger btn-sm" type="submit" disabled={pending}>{pending ? "Deleting…" : "Delete path"}</button>
            <button type="button" className="mini" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}
    </section>
  );
}

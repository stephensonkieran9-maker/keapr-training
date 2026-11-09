"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PHOTO_CATEGORIES } from "@/lib/assessment/fields";
import { addPhoto, photoUploadTicket, removePhoto, setPhotoCategory } from "@/lib/assessment/admin-actions";
import { getBrowserClient } from "@/lib/supabase/browser";

interface Photo { id: string; name: string; category: string; url: string | null }

/** Upload the property photos and say which room each one shows. The
 * categories are the answer key for the candidate's photo order. */
export function PhotoManager({ id, photos, started }: { id: string; photos: Photo[]; started: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [, start] = useTransition();

  const upload = async (files: FileList) => {
    const errs: string[] = [];
    const list = [...files];
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      setBusy(`Uploading ${i + 1} of ${list.length}: ${f.name}`);
      const ticket = await photoUploadTicket(id, f.name);
      if ("error" in ticket) { errs.push(ticket.error); continue; }
      const body = await f.arrayBuffer();
      const { error } = await getBrowserClient().storage.from("assessment-photos").uploadToSignedUrl(ticket.path, ticket.token, body, { contentType: f.type || "image/jpeg" });
      if (error) { errs.push(`${f.name}: ${error.message}`); continue; }
      const r = await addPhoto(id, ticket.path, f.name);
      if ("error" in r) errs.push(r.error);
    }
    setBusy("");
    setErrors(errs);
    router.refresh();
  };

  const counts = PHOTO_CATEGORIES.map((c) => ({ ...c, n: photos.filter((p) => p.category === c.value).length }));

  return (
    <div className="form-stack">
      <div className="notice">
        Upload every photo for the listing and choose which room each one shows. Candidates download them as a zip in a shuffled order with neutral names, upload them, and are marked on whether they used them all and put them in this order: <strong>living spaces, dining, kitchen, bedrooms, bathrooms, then anything else</strong>.
        {started > 0 && <> Candidates who have already started keep the photos they started with.</>}
      </div>

      <div className="card form-stack">
        <div className="actions-row">
          <label className="btn btn-primary btn-sm ph-upload-btn">
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={Boolean(busy)} onChange={(e) => e.target.files && void upload(e.target.files)} />
            Upload photos
          </label>
          {photos.length > 0 && <a className="btn btn-ghost btn-sm" href={`/admin/assessments/${id}/photos`} download>Download the candidate zip</a>}
          <span className="hint" aria-live="polite">{busy || `${photos.length} photo${photos.length === 1 ? "" : "s"}. JPG, PNG or WebP, up to 15 MB each.`}</span>
        </div>
        {errors.length > 0 && <div className="notice error" role="alert"><ul>{errors.map((e) => <li key={e}>{e}</li>)}</ul></div>}
        {photos.length > 0 && <p className="hint">{counts.filter((c) => c.n).map((c) => `${c.n} ${c.label.replace(/\s*\(.*\)$/, "").toLowerCase()}`).join(" · ")}</p>}
      </div>

      {photos.length > 0 && (
        <ul className="ph-admin">
          {photos.map((p) => (
            <li key={p.id} className="card">
              {p.url ? <img src={p.url} alt={p.name} /> : <div className="ph-missing">{p.name}</div>}
              <div className="ph-admin-body">
                <small title={p.name}>{p.name}</small>
                <label className="sr-only" htmlFor={`cat-${p.id}`}>Room shown in {p.name}</label>
                <select id={`cat-${p.id}`} defaultValue={p.category} onChange={(e) => start(async () => { await setPhotoCategory(id, p.id, e.target.value); router.refresh(); })}>
                  {PHOTO_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <button type="button" className="lb-link" onClick={() => start(async () => { await removePhoto(id, p.id); router.refresh(); })}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { CaseStudy } from "../CaseStudy";
import { FieldInput } from "../ListingFields";
import { FIELDS, SECTIONS, emptyValue, type AnswerValue } from "@/lib/assessment/fields";
import type { AssessmentConfig, FieldKey } from "@/lib/assessment/scoring";
import { saveCaseStudy, saveConfig, saveSettings, setCandidatePassword, type AssessActionState } from "@/lib/assessment/admin-actions";

function Save({ label = "Save" }: { label?: string }) {
  const { pending } = useFormStatus();
  return <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>{pending ? "Saving…" : label}</button>;
}

function Result({ state }: { state: AssessActionState | undefined }) {
  if (!state) return null;
  if (state.error) return <p className="notice error" role="alert">{state.error}</p>;
  return (
    <>
      {state.message && <p className="notice ok" role="status">{state.message}</p>}
      {state.problems && state.problems.length > 0 && (
        <div className="notice error" role="alert">
          Saved, but fix these before opening the assessment:
          <ul>{state.problems.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      )}
    </>
  );
}

export function SettingsForm({ id, title, minutes, intro }: { id: string; title: string; minutes: number; intro: string }) {
  const [state, action] = useActionState(saveSettings, undefined);
  return (
    <form action={action} className="card form-stack">
      <h2>Settings</h2>
      <input type="hidden" name="id" value={id} />
      <div className="form-row">
        <div className="field"><label htmlFor="as-title">Title (candidates see this)</label><input id="as-title" name="title" defaultValue={title} required maxLength={200} /></div>
        <div className="field"><label htmlFor="as-min">Hidden cut-off (minutes)</label><input id="as-min" name="minutes" type="number" min={5} max={240} defaultValue={minutes} required aria-describedby="as-min-hint" /><p className="hint" id="as-min-hint">Candidates aren&apos;t shown a timer or told about this. If they reach it, their work is submitted automatically. You see how long each one took in the results.</p></div>
      </div>
      <div className="field">
        <label htmlFor="as-intro">Instructions shown before the candidate starts</label>
        <textarea id="as-intro" name="intro" rows={9} defaultValue={intro} />
        <p className="hint">Supports **bold**, *italic*, - bullet points and # headings.</p>
      </div>
      <Result state={state} />
      <div className="actions-row"><Save /></div>
    </form>
  );
}

export function CaseStudyEditor({ id, text, started }: { id: string; text: string; started: number }) {
  const [state, action] = useActionState(saveCaseStudy, undefined);
  const [value, setValue] = useState(text);
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="id" value={id} />
      {started > 0 && <p className="notice">{started} candidate{started === 1 ? " has" : "s have"} already started. They keep the version of the case study they started with.</p>}
      <div className="cs-editor">
        <div className="field">
          <label htmlFor="cs-text">Case study</label>
          <textarea id="cs-text" name="caseStudy" value={value} onChange={(e) => setValue(e.target.value)} spellCheck />
          <p className="hint">Headings: # / ## / ###. Bullets: "- ". Tables: | a | b |. Quotes: "&gt; ". Bold: **text**. Divider: ---</p>
        </div>
        <div className="cs-preview" aria-label="Preview">
          <div className="eyebrow">Preview</div>
          <CaseStudy text={value} />
        </div>
      </div>
      <Result state={state} />
      <div className="actions-row"><Save label="Save case study" /></div>
    </form>
  );
}

/** The answer key, edited with the same inputs candidates use. Each field
 * can be turned on or off and given a weight. */
export function AnswerKeyEditor({ id, config, started }: { id: string; config: AssessmentConfig; started: number }) {
  const [fields, setFields] = useState<Record<string, FieldKey>>(config.fields);
  const [state, setState] = useState<AssessActionState | undefined>();
  const [pending, start] = useTransition();
  const [dirty, setDirty] = useState(false);

  const update = (fid: string, patch: Partial<FieldKey> | null) => {
    setDirty(true);
    setFields((cur) => {
      const next = { ...cur };
      if (patch === null) delete next[fid];
      else next[fid] = { ...(cur[fid] ?? { weight: 1 }), ...patch };
      return next;
    });
  };

  const save = () => start(async () => {
    const r = await saveConfig(id, { fields });
    setState(r);
    if (!r.error) setDirty(false);
  });

  const total = Object.values(fields).reduce((n, k) => n + (Number(k.weight) || 0), 0);

  return (
    <div className="form-stack">
      <div className="notice">
        Fields that are <strong>on</strong> appear in the candidate&apos;s listing form. Each is worth its <strong>weight</strong> in points, and accuracy is points earned out of {total} available.
        Weight 0 shows a field without marking it. Amenities and target guests are marked by overlap, so ticking extra boxes costs marks.
        {started > 0 && <> Candidates who have already started are marked against the key as it was when they started, until you use <strong>Re-mark everyone</strong> on the Results tab.</>}
      </div>

      {SECTIONS.map((s) => (
        <section key={s.id} className="card key-section">
          <h2>{s.label}</h2>
          {FIELDS.filter((f) => f.section === s.id).map((f) => {
            const k = fields[f.id];
            const on = Boolean(k);
            return (
              <div key={f.id} className={`key-row${on ? "" : " off"}`}>
                <div className="key-controls">
                  <label className="check">
                    <input type="checkbox" checked={on} onChange={(e) => update(f.id, e.target.checked ? { weight: 1, answer: f.type === "text" ? undefined : emptyValue(f), mustMention: f.type === "text" ? [] : undefined } : null)} />
                    <span>{on ? "On" : "Off"}</span>
                  </label>
                  {on && (
                    <label className="key-weight">
                      Weight
                      <input type="number" min={0} max={100} step={0.5} value={k.weight} onChange={(e) => update(f.id, { weight: Number(e.target.value) })} />
                    </label>
                  )}
                  {on && f.type === "number" && (
                    <label className="key-weight">
                      ±
                      <input type="number" min={0} step="any" value={k.tolerance ?? 0} onChange={(e) => update(f.id, { tolerance: Number(e.target.value) || undefined })} aria-label={`Tolerance for ${f.label}`} />
                    </label>
                  )}
                </div>
                <div className="key-answer">
                  {!on ? (
                    <div className="lb-label">{f.label}</div>
                  ) : f.type === "text" ? (
                    <div className="field">
                      <label htmlFor={`mm-${f.id}`}>{f.label}: facts it must mention (one per line)</label>
                      <textarea
                        id={`mm-${f.id}`}
                        rows={Math.max(3, (k.mustMention ?? []).length + 1)}
                        value={(k.mustMention ?? []).join("\n")}
                        onChange={(e) => update(f.id, { mustMention: e.target.value.split("\n") })}
                      />
                      <p className="hint">Separate acceptable alternatives with | (e.g. <code>3 bed|three bed</code>). Matches whole words, ignoring case and punctuation.</p>
                    </div>
                  ) : f.type === "photos" ? (
                    <div>
                      <div className="lb-label">{f.label}</div>
                      <p className="hint">Upload the photos and set which room each shows on the <strong>Photos</strong> tab.</p>
                    </div>
                  ) : f.type === "shorttext" ? (
                    <div className="field">
                      <label htmlFor={`st-${f.id}`}>{f.label}: correct answer</label>
                      <input id={`st-${f.id}`} value={String(k.answer ?? "")} onChange={(e) => update(f.id, { answer: e.target.value })} />
                      <p className="hint">Case, spaces and punctuation are ignored. Separate alternatives with |.</p>
                    </div>
                  ) : (
                    <>
                      <FieldInput f={f} value={k.answer as AnswerValue} onChange={(v) => update(f.id, { answer: v })} />
                      {f.type === "number" && (
                        <div className="field key-explain">
                          <label htmlFor={`ex-${f.id}`}>Working shown in results (optional)</label>
                          <input id={`ex-${f.id}`} value={k.explanation ?? ""} maxLength={500} onChange={(e) => update(f.id, { explanation: e.target.value })} placeholder="e.g. 28 nights × £125 = £3,500, plus £60 cleaning" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      ))}

      <div className="key-savebar">
        {state?.error && <p className="notice error" role="alert">{state.error}</p>}
        {state?.problems && state.problems.length > 0 && (
          <div className="notice error" role="alert">Saved, but fix these before opening the assessment:<ul>{state.problems.map((p) => <li key={p}>{p}</li>)}</ul></div>
        )}
        {state?.message && !dirty && <p className="notice ok" role="status">{state.message}</p>}
        <div className="actions-row">
          <button type="button" className="btn btn-primary" onClick={save} disabled={pending}>{pending ? "Saving…" : "Save answer key"}</button>
          {dirty && <span className="hint">Unsaved changes</span>}
        </div>
      </div>
    </div>
  );
}

export function CandidatePasswordForm({ id, candidateId }: { id: string; candidateId: string }) {
  const [state, action] = useActionState(setCandidatePassword, undefined);
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="candidateId" value={candidateId} />
      <div className="field">
        <label htmlFor="cp-pw">New password</label>
        <input id="cp-pw" name="password" type="text" minLength={8} required autoComplete="off" />
        <p className="hint">For a candidate who has forgotten theirs. Send it to them yourself.</p>
      </div>
      <Result state={state} />
      <div className="actions-row"><Save label="Set password" /></div>
    </form>
  );
}

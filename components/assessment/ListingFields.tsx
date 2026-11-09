"use client";

import { useId } from "react";
import {
  BED_TYPES, TIME_OPTIONS, countBeds, emptyRooms,
  type AnswerValue, type Beds, type FieldDef, type RoomsValue,
} from "@/lib/assessment/fields";

// Inputs for the listing builder, styled after the big booking sites'
// listing editors: option tiles, amenity checklists, − / + counters.
// Used by the candidate test, the admin preview and the answer-key editor.

type Change = (v: AnswerValue) => void;

function Stepper({ value, onChange, min = 0, max = 99, step = 1, label, disabled }: {
  value: number | null; onChange: (v: number) => void; min?: number; max?: number; step?: number; label: string; disabled?: boolean;
}) {
  const v = value ?? null;
  const set = (n: number) => onChange(Math.min(max, Math.max(min, Math.round(n * 100) / 100)));
  return (
    <div className="lb-stepper" role="group" aria-label={label}>
      <button type="button" disabled={disabled || (v !== null && v <= min)} onClick={() => set((v ?? min) - step)} aria-label={`Decrease ${label}`}>−</button>
      <output aria-live="polite">{v === null ? "–" : v}</output>
      <button type="button" disabled={disabled || (v !== null && v >= max)} onClick={() => set(v === null ? min + (min === 0 ? step : 0) : v + step)} aria-label={`Increase ${label}`}>+</button>
    </div>
  );
}

function NumberInput({ f, value, onChange, id, disabled }: { f: FieldDef; value: number | null; onChange: Change; id: string; disabled?: boolean }) {
  if (f.stepper) return <Stepper value={value} onChange={onChange} min={f.min} max={f.max} step={f.step} label={f.label} disabled={disabled} />;
  return (
    <div className="lb-affix">
      {f.prefix && <span aria-hidden="true">{f.prefix}</span>}
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={f.min}
        max={f.max}
        step={f.step ?? "any"}
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        onWheel={(e) => (e.target as HTMLInputElement).blur()}
      />
      {f.suffix && <span aria-hidden="true">{f.suffix}</span>}
    </div>
  );
}

function BedCounts({ beds, onChange, label, disabled }: { beds: Beds; onChange: (b: Beds) => void; label: string; disabled?: boolean }) {
  return (
    <div className="lb-beds">
      {BED_TYPES.map((t) => (
        <div key={t.value} className="lb-bedrow">
          <span>{t.label}</span>
          <Stepper
            value={beds[t.value] ?? 0}
            min={0}
            max={10}
            label={`${t.label}, ${label}`}
            disabled={disabled}
            onChange={(n) => {
              const next = { ...beds };
              if (n > 0) next[t.value] = n; else delete next[t.value];
              onChange(next);
            }}
          />
        </div>
      ))}
    </div>
  );
}

function RoomsInput({ value, onChange, disabled }: { value: RoomsValue | null; onChange: Change; disabled?: boolean }) {
  const r = value ?? emptyRooms();
  const set = (next: RoomsValue) => onChange(next);
  return (
    <div className="lb-rooms">
      {r.bedrooms.map((b, i) => (
        <div className="lb-room" key={i}>
          <div className="lb-room-head">
            <strong>Bedroom {i + 1}</strong>
            <small>{countBeds(b)} {countBeds(b) === 1 ? "bed" : "beds"}</small>
            {!disabled && i === r.bedrooms.length - 1 && (
              <button type="button" className="lb-link" onClick={() => set({ ...r, bedrooms: r.bedrooms.slice(0, -1) })}>Remove</button>
            )}
          </div>
          <BedCounts beds={b} label={`bedroom ${i + 1}`} disabled={disabled} onChange={(nb) => set({ ...r, bedrooms: r.bedrooms.map((x, j) => (j === i ? nb : x)) })} />
        </div>
      ))}
      {!disabled && r.bedrooms.length < 12 && (
        <button type="button" className="btn btn-ghost btn-sm lb-add" onClick={() => set({ ...r, bedrooms: [...r.bedrooms, {}] })}>+ Add bedroom</button>
      )}
      <div className="lb-room">
        <div className="lb-room-head">
          <strong>Common spaces</strong>
          <small>Living room and other spaces · {countBeds(r.common)} {countBeds(r.common) === 1 ? "bed" : "beds"}</small>
        </div>
        <BedCounts beds={r.common} label="common spaces" disabled={disabled} onChange={(c) => set({ ...r, common: c })} />
      </div>
    </div>
  );
}

export function FieldInput({ f, value, onChange, disabled }: { f: FieldDef; value: AnswerValue | undefined; onChange: Change; disabled?: boolean }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const v = value ?? null;

  let control: React.ReactNode;
  let group = false;

  switch (f.type) {
    case "number":
      control = <NumberInput f={f} value={typeof v === "number" ? v : null} onChange={onChange} id={id} disabled={disabled} />;
      group = Boolean(f.stepper);
      break;
    case "shorttext":
      control = <input id={id} type="text" value={typeof v === "string" ? v : ""} maxLength={f.maxLength} placeholder={f.placeholder} disabled={disabled} onChange={(e) => onChange(e.target.value)} autoComplete="off" />;
      break;
    case "text": {
      const s = typeof v === "string" ? v : "";
      control = (
        <>
          {f.multiline
            ? <textarea id={id} rows={6} value={s} maxLength={f.maxLength} disabled={disabled} onChange={(e) => onChange(e.target.value)} aria-describedby={hintId} />
            : <input id={id} type="text" value={s} maxLength={f.maxLength} disabled={disabled} onChange={(e) => onChange(e.target.value)} aria-describedby={hintId} autoComplete="off" />}
          {f.maxLength && <span className="lb-count" aria-live="polite">{s.length} / {f.maxLength}</span>}
        </>
      );
      break;
    }
    case "time":
      control = (
        <select id={id} value={typeof v === "string" ? v : ""} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select a time</option>
          {TIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
      break;
    case "yesno":
      group = true;
      control = (
        <div className="lb-seg" role="radiogroup" aria-label={f.label}>
          {(["yes", "no"] as const).map((x) => (
            <label key={x} className={v === x ? "on" : ""}>
              <input type="radio" name={id} value={x} checked={v === x} disabled={disabled} onChange={() => onChange(x)} />
              {x === "yes" ? "Yes" : "No"}
            </label>
          ))}
        </div>
      );
      break;
    case "select": {
      const options = f.options ?? [];
      if (options.length <= 7) {
        group = true;
        control = (
          <div className="lb-tiles" role="radiogroup" aria-label={f.label}>
            {options.map((o) => (
              <label key={o.value} className={`lb-tile${v === o.value ? " on" : ""}`}>
                <input type="radio" name={id} value={o.value} checked={v === o.value} disabled={disabled} onChange={() => onChange(o.value)} />
                {o.label}
              </label>
            ))}
          </div>
        );
      } else {
        control = (
          <select id={id} value={typeof v === "string" ? v : ""} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
            <option value="">Select…</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        );
      }
      break;
    }
    case "multi": {
      group = true;
      const chosen = new Set(Array.isArray(v) ? (v as string[]) : []);
      const toggle = (val: string) => {
        const next = new Set(chosen);
        if (next.has(val)) next.delete(val); else next.add(val);
        onChange((f.options ?? []).map((o) => o.value).filter((x) => next.has(x)));
      };
      const groups = [...new Set((f.options ?? []).map((o) => o.group ?? ""))];
      control = (
        <div className="lb-multi">
          {groups.map((gname) => (
            <fieldset key={gname || "all"} className="lb-group">
              {gname && <legend>{gname}</legend>}
              <div className="lb-checks">
                {(f.options ?? []).filter((o) => (o.group ?? "") === gname).map((o) => (
                  <label key={o.value} className={`lb-check${chosen.has(o.value) ? " on" : ""}`}>
                    <input type="checkbox" checked={chosen.has(o.value)} disabled={disabled} onChange={() => toggle(o.value)} />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      );
      break;
    }
    case "rooms":
      group = true;
      control = <RoomsInput value={v as RoomsValue | null} onChange={onChange} disabled={disabled} />;
      break;
  }

  return (
    <div className={`lb-field lb-${f.type}`}>
      {group ? <div className="lb-label" id={`${id}-label`}>{f.label}</div> : <label className="lb-label" htmlFor={id}>{f.label}</label>}
      {f.hint && <p className="lb-hint" id={hintId}>{f.hint}</p>}
      {control}
    </div>
  );
}

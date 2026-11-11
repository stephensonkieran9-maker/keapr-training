"use client";

import { useRef, useState } from "react";
import { FIELD_BY_ID, SECTIONS, type AnswerValue, type Answers } from "@/lib/assessment/fields";
import { FieldInput } from "./ListingFields";

/** The right-hand listing editor: section steps across the top, one section
 * of fields at a time, Back / Next at the bottom. */
export function ListingBuilder({ fieldIds, answers, onChange, disabled, footer }: {
  fieldIds: string[];
  answers: Answers;
  onChange: (id: string, v: AnswerValue) => void;
  disabled?: boolean;
  footer?: React.ReactNode;
}) {
  const fields = fieldIds.map((id) => FIELD_BY_ID[id]).filter(Boolean);
  const sections = SECTIONS.filter((s) => fields.some((f) => f.section === s.id));
  const [current, setCurrent] = useState(sections[0]?.id);
  const top = useRef<HTMLDivElement>(null);
  const idx = Math.max(0, sections.findIndex((s) => s.id === current));
  const section = sections[idx];

  const go = (i: number) => {
    setCurrent(sections[i].id);
    top.current?.scrollIntoView({ block: "start" });
    top.current?.focus({ preventScroll: true });
  };


  if (!section) return <p className="notice">No fields have been turned on for this assessment.</p>;

  return (
    <div className="lb">
      <nav className="lb-steps" aria-label="Listing sections">
        {/* No "filled" counts or ticks: candidates check their own work. */}
        {sections.map((s, i) => (
          <button key={s.id} type="button" aria-current={i === idx ? "step" : undefined} onClick={() => go(i)}>
            <span className="lb-step-n" aria-hidden="true">{i + 1}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </nav>

      <div className="lb-body" ref={top} tabIndex={-1}>
        <div className="lb-section-head">
          <span className="eyebrow">Step {idx + 1} of {sections.length}</span>
          <h2>{section.label}</h2>
          <p>{section.blurb}</p>
        </div>
        <div className="lb-fields">
          {fields.filter((f) => f.section === section.id).map((f) => (
            <FieldInput key={f.id} f={f} value={answers[f.id]} disabled={disabled} onChange={(v) => onChange(f.id, v)} />
          ))}
        </div>
        <div className="lb-nav">
          <button type="button" className="btn btn-ghost" disabled={idx === 0} onClick={() => go(idx - 1)}>Back</button>
          {idx < sections.length - 1
            ? <button type="button" className="btn btn-primary" onClick={() => go(idx + 1)}>Next: {sections[idx + 1].label}</button>
            : footer}
        </div>
      </div>
    </div>
  );
}

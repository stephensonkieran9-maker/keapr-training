"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FIELD_BY_ID, isAnswered, type AnswerValue, type Answers } from "@/lib/assessment/fields";
import { CaseStudy } from "./CaseStudy";
import { ListingBuilder } from "./ListingBuilder";
import { PhotoContext } from "./PhotosInput";

export type SaveOutcome = "ok" | "expired" | "submitted" | "error";

function clock(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
}

const timeOfDay = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/** The timed split screen: case study on the left, listing builder on the
 * right. Saving and submitting are passed in, so the admin preview can use
 * the same screen without recording anything. */
export function TestScreen({ title, caseStudy, fieldIds, initialAnswers, deadlineAt, serverNow, save, submit, banner, photos }: {
  title: string;
  caseStudy: string;
  fieldIds: string[];
  initialAnswers: Answers;
  deadlineAt: string | null;
  serverNow: number;
  save: ((answers: Answers, opts?: { keepalive?: boolean }) => Promise<SaveOutcome>) | null;
  submit: (answers: Answers, kind: "candidate" | "timeout") => Promise<void>;
  banner?: React.ReactNode;
  photos?: { downloadHref: string | null; urls: Record<string, string> };
}) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [pane, setPane] = useState<"case" | "form">("case");
  const [status, setStatus] = useState<{ kind: "idle" | "saving" | "saved" | "error"; at?: Date }>({ kind: "idle" });
  const [remaining, setRemaining] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [announce, setAnnounce] = useState("");
  const latest = useRef(answers);
  const dirty = useRef(false);
  const saving = useRef(false);
  const finished = useRef(false);
  const skew = useRef(serverNow - Date.now());
  const dialog = useRef<HTMLDialogElement>(null);

  const onChange = (id: string, v: AnswerValue) => {
    setAnswers((a) => {
      const next = { ...a, [id]: v };
      latest.current = next;
      return next;
    });
    dirty.current = true;
  };

  const flush = useCallback(async (keepalive = false) => {
    if (!save || !dirty.current || saving.current || finished.current) return;
    saving.current = true;
    dirty.current = false;
    setStatus({ kind: "saving" });
    const outcome = await save(latest.current, { keepalive }).catch(() => "error" as const);
    saving.current = false;
    if (outcome === "ok") setStatus({ kind: "saved", at: new Date() });
    else if (outcome === "error") { dirty.current = true; setStatus({ kind: "error" }); }
    else { finished.current = true; window.location.reload(); }
  }, [save]);

  const doSubmit = useCallback(async (kind: "candidate" | "timeout") => {
    if (finished.current) return;
    finished.current = true;
    setSubmitting(true);
    dialog.current?.close();
    try {
      await submit(latest.current, kind);
    } catch {
      finished.current = false;
      setSubmitting(false);
      setStatus({ kind: "error" });
    }
  }, [submit]);

  // Autosave every few seconds, and when the tab is hidden or closed.
  useEffect(() => {
    if (!save) return;
    const t = window.setInterval(() => void flush(), 5000);
    const hide = () => { if (document.visibilityState === "hidden") void flush(true); };
    const leave = () => void flush(true);
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", leave);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", leave);
    };
  }, [flush, save]);

  // Countdown from the server's deadline, corrected for the device clock.
  useEffect(() => {
    if (!deadlineAt) return;
    const end = new Date(deadlineAt).getTime();
    const warned = new Set<number>();
    const tick = () => {
      const left = end - (Date.now() + skew.current);
      setRemaining(left);
      for (const mins of [10, 5, 1]) {
        if (left <= mins * 60_000 && left > (mins * 60_000 - 5000) && !warned.has(mins)) {
          warned.add(mins);
          setAnnounce(`${mins} minute${mins === 1 ? "" : "s"} left.`);
        }
      }
      if (left <= 0) void doSubmit("timeout");
    };
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [deadlineAt, doSubmit]);

  const unanswered = fieldIds.filter((id) => FIELD_BY_ID[id] && !isAnswered(FIELD_BY_ID[id], answers[id])).length;
  const urgency = remaining === null ? "" : remaining <= 120_000 ? "danger" : remaining <= 600_000 ? "warn" : "";

  const submitButton = (
    <button type="button" className="btn btn-primary" disabled={submitting} onClick={() => dialog.current?.showModal()}>
      {submitting ? "Submitting…" : "Submit listing"}
    </button>
  );

  return (
    <div className="at">
      <header className="at-bar">
        <div className="at-brand"><span className="mark">K</span><span className="at-title">{title}</span></div>
        <div className="at-status" aria-live="polite">
          {status.kind === "saving" && "Saving…"}
          {status.kind === "saved" && status.at && `Saved ${timeOfDay(status.at)}`}
          {status.kind === "error" && <span className="at-err">Not saved. Check your connection.</span>}
        </div>
        {remaining !== null && (
          <div className={`at-timer ${urgency}`} role="timer" aria-label={`Time left ${clock(remaining)}`}>
            <span aria-hidden="true">⏱</span> {clock(remaining)}
          </div>
        )}
        {submitButton}
      </header>
      <div className="sr-only" aria-live="assertive">{announce}</div>
      {banner}

      <div className="at-tabs" role="tablist" aria-label="Show">
        <button role="tab" aria-selected={pane === "case"} onClick={() => setPane("case")}>Case study</button>
        <button role="tab" aria-selected={pane === "form"} onClick={() => setPane("form")}>Listing ({fieldIds.length - unanswered}/{fieldIds.length})</button>
      </div>

      <div className="at-panes">
        <section className={`at-case${pane === "case" ? " show" : ""}`} aria-label="Case study">
          <CaseStudy text={caseStudy} />
        </section>
        <section className={`at-form${pane === "form" ? " show" : ""}`} aria-label="Listing builder">
          <PhotoContext.Provider value={photos ?? { downloadHref: null, urls: {} }}>
            <ListingBuilder fieldIds={fieldIds} answers={answers} onChange={onChange} disabled={submitting} footer={submitButton} />
          </PhotoContext.Provider>
        </section>
      </div>

      <dialog ref={dialog} className="at-dialog" aria-labelledby="submit-title">
        <h2 id="submit-title">Submit your listing?</h2>
        <p>You can&apos;t change anything after you submit.</p>
        {unanswered > 0 && <p className="notice">{unanswered} field{unanswered === 1 ? " is" : "s are"} still empty.</p>}
        <div className="actions-row">
          <button type="button" className="btn btn-ghost" onClick={() => dialog.current?.close()}>Keep working</button>
          <button type="button" className="btn btn-primary" onClick={() => void doSubmit("candidate")}>Submit now</button>
        </div>
      </dialog>
    </div>
  );
}

"use client";

import type { Answers } from "@/lib/assessment/fields";
import { TestScreen, type SaveOutcome } from "./TestScreen";

/** The candidate's timed test, saving to the server as they go. */
export function CandidateTest({ slug, ...props }: {
  slug: string;
  title: string;
  caseStudy: string;
  fieldIds: string[];
  initialAnswers: Answers;
  deadlineAt: string;
  serverNow: number;
}) {
  const save = async (answers: Answers, opts?: { keepalive?: boolean }): Promise<SaveOutcome> => {
    const res = await fetch(`/assess/${slug}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
      keepalive: opts?.keepalive,
    });
    if (!res.ok) return "error";
    const body = (await res.json()) as { ok: boolean; reason?: string };
    if (body.ok) return "ok";
    return body.reason === "submitted" ? "submitted" : body.reason === "expired" ? "expired" : "error";
  };

  const submit = async (answers: Answers, kind: "candidate" | "timeout") => {
    const res = await fetch(`/assess/${slug}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, kind }),
    });
    if (!res.ok) throw new Error("submit failed");
    window.location.assign(`/assess/${slug}`);
  };

  return <TestScreen {...props} save={save} submit={submit} />;
}

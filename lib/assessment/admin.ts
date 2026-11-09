import "server-only";
import { createAdminClient, check } from "@/lib/supabase/admin";
import { cleanAnswers, type Answers } from "./fields";
import { finaliseExpired, GRACE_SECONDS } from "./server";
import { cleanConfig, formFieldIds, type AssessmentConfig, type CandidateRow, type CandidateStatus, type PhotoKey, type ScoreResult } from "./scoring";

// Admin reads for listing assessments. Callers must have run requireAdmin().

export interface AssessmentSummary {
  id: string;
  title: string;
  slug: string;
  isOpen: boolean;
  isDemo: boolean;
  timeLimitMinutes: number;
  createdAt: string;
  archivedAt: string | null;
  registered: number;
  finished: number;
  bestAccuracy: number | null;
}

export interface AssessmentFull {
  id: string;
  title: string;
  slug: string;
  intro: string;
  caseStudy: string;
  config: AssessmentConfig;
  timeLimitMinutes: number;
  isOpen: boolean;
  isDemo: boolean;
  archivedAt: string | null;
  updatedAt: string;
  started: number;
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
}

export function assessmentLink(slug: string) {
  return `${siteUrl()}/assess/${slug}`;
}

export async function listAssessments(): Promise<AssessmentSummary[]> {
  const db = createAdminClient();
  const list = check("assessments", await db.from("assessments")
    .select("id, title, slug, is_open, is_demo, time_limit_minutes, created_at, archived_at")
    .order("created_at", { ascending: false }));
  const cands = check("candidates", await db.from("assessment_candidates").select("assessment_id"));
  const attempts = check("attempts", await db.from("assessment_attempts").select("assessment_id, accuracy"));
  return list.map((a) => {
    const done = attempts.filter((x) => x.assessment_id === a.id && x.accuracy !== null).map((x) => Number(x.accuracy));
    return {
      id: a.id, title: a.title, slug: a.slug, isOpen: a.is_open, isDemo: a.is_demo, timeLimitMinutes: a.time_limit_minutes,
      createdAt: a.created_at, archivedAt: a.archived_at,
      registered: cands.filter((c) => c.assessment_id === a.id).length,
      finished: done.length,
      bestAccuracy: done.length ? Math.max(...done) : null,
    };
  });
}

export async function getAssessment(id: string): Promise<AssessmentFull | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const db = createAdminClient();
  const { data } = await db.from("assessments")
    .select("id, title, slug, intro, case_study, config, time_limit_minutes, is_open, is_demo, archived_at, updated_at")
    .eq("id", id).maybeSingle();
  if (!data) return null;
  const { count } = await db.from("assessment_attempts").select("id", { count: "exact", head: true }).eq("assessment_id", id);
  return {
    id: data.id, title: data.title, slug: data.slug, intro: data.intro, caseStudy: data.case_study,
    config: cleanConfig(data.config), timeLimitMinutes: data.time_limit_minutes, isOpen: data.is_open, isDemo: data.is_demo,
    archivedAt: data.archived_at, updatedAt: data.updated_at, started: count ?? 0,
  };
}

function statusOf(att: { submitted_at: string | null; submit_kind: string | null; deadline_at: string } | null): CandidateStatus {
  if (!att) return "registered";
  if (att.submitted_at) return att.submit_kind === "timeout" ? "timed_out" : "submitted";
  return "in_progress";
}

export async function loadCandidateRows(assessmentId: string): Promise<CandidateRow[]> {
  await finaliseExpired({ assessmentId });
  const db = createAdminClient();
  const cands = check("candidates", await db.from("assessment_candidates")
    .select("id, full_name, email, phone, created_at").eq("assessment_id", assessmentId));
  const atts = check("attempts", await db.from("assessment_attempts")
    .select("candidate_id, started_at, deadline_at, submitted_at, submit_kind, accuracy, time_taken_seconds").eq("assessment_id", assessmentId));
  const byCand = new Map(atts.map((a) => [a.candidate_id, a]));
  return cands.map((c) => {
    const a = byCand.get(c.id) ?? null;
    return {
      candidateId: c.id, name: c.full_name, email: c.email, phone: c.phone, registeredAt: c.created_at,
      status: statusOf(a), startedAt: a?.started_at ?? null, submittedAt: a?.submitted_at ?? null,
      accuracy: a?.accuracy === null || a?.accuracy === undefined ? null : Number(a.accuracy),
      timeTakenSeconds: a?.time_taken_seconds ?? null,
    };
  });
}

export interface CandidateDetail {
  row: CandidateRow;
  assessmentId: string;
  deadlineAt: string | null;
  savedAt: string | null;
  answers: Answers;
  fieldIds: string[];
  score: ScoreResult | null;
  photos: PhotoKey[];
}

export async function getCandidateDetail(assessmentId: string, candidateId: string): Promise<CandidateDetail | null> {
  if (!/^[0-9a-f-]{36}$/.test(candidateId)) return null;
  await finaliseExpired({ candidateId });
  const db = createAdminClient();
  const { data: c } = await db.from("assessment_candidates").select("id, assessment_id, full_name, email, phone, created_at").eq("id", candidateId).maybeSingle();
  if (!c || c.assessment_id !== assessmentId) return null;
  const { data: a } = await db.from("assessment_attempts")
    .select("started_at, deadline_at, submitted_at, submit_kind, accuracy, time_taken_seconds, answers, saved_at, score, config_snapshot")
    .eq("candidate_id", candidateId).maybeSingle();
  const fieldIds = a ? formFieldIds(cleanConfig(a.config_snapshot)) : [];
  return {
    assessmentId,
    row: {
      candidateId: c.id, name: c.full_name, email: c.email, phone: c.phone, registeredAt: c.created_at,
      status: statusOf(a ?? null), startedAt: a?.started_at ?? null, submittedAt: a?.submitted_at ?? null,
      accuracy: a?.accuracy === null || a?.accuracy === undefined ? null : Number(a.accuracy), timeTakenSeconds: a?.time_taken_seconds ?? null,
    },
    deadlineAt: a?.deadline_at ?? null,
    savedAt: a?.saved_at ?? null,
    answers: a ? cleanAnswers(fieldIds, a.answers) : {},
    fieldIds,
    score: (a?.score as ScoreResult | null) ?? null,
    photos: a ? cleanConfig(a.config_snapshot).photos ?? [] : [],
  };
}

export { GRACE_SECONDS };

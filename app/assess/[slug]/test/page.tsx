import { notFound, redirect } from "next/navigation";
import { CandidateTest } from "@/components/assessment/CandidateTest";
import { currentCandidate, getAssessmentBySlug, getAttempt } from "@/lib/assessment/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Listing exercise · Keapr", robots: { index: false, follow: false } };

export default async function TestPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!isSupabaseConfigured()) notFound();
  const { slug } = await params;
  const a = await getAssessmentBySlug(slug);
  if (!a) notFound();
  const c = await currentCandidate(a.id);
  if (!c) redirect(`/assess/${slug}?mode=signin`);
  const attempt = await getAttempt(c.id);
  // No attempt yet, or already submitted: the landing page explains.
  if (!attempt || attempt.submittedAt) redirect(`/assess/${slug}`);

  return (
    <CandidateTest
      slug={slug}
      title={a.title}
      caseStudy={attempt.caseStudy}
      fieldIds={attempt.fieldIds}
      initialAnswers={attempt.answers}
      deadlineAt={attempt.deadlineAt}
      serverNow={Date.now()}
    />
  );
}

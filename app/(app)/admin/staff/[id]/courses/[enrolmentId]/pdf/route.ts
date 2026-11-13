import { notFound } from "next/navigation";
import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEnrolmentDetail } from "@/lib/admin/attempt-detail-data";
import { resultsPdfResponse } from "@/lib/admin/results-pdf-response";

export const dynamic = "force-dynamic";

/** One person's results for one course, as a PDF. Admins only. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; enrolmentId: string }> }) {
  const { profile } = await requireAdmin();
  const { id, enrolmentId } = await params;
  const d = await getEnrolmentDetail(enrolmentId);
  if (!d || d.learnerId !== id) notFound();
  const { data: p } = await createAdminClient().from("profiles").select("email").eq("id", id).maybeSingle();
  return resultsPdfResponse(
    { learnerName: d.learnerName, learnerEmail: p?.email ?? undefined, courses: [d], generatedAt: new Date().toISOString(), generatedBy: profile.fullName },
    req.nextUrl.searchParams.has("view"),
  );
}

import { notFound } from "next/navigation";
import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEnrolmentDetail } from "@/lib/admin/attempt-detail-data";
import { resultsPdfResponse } from "@/lib/admin/results-pdf-response";

export const dynamic = "force-dynamic";

/** One person's results across every course currently assigned to them, as a PDF. Admins only. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireAdmin();
  const { id } = await params;
  const admin = createAdminClient();
  const { data: p } = await admin.from("profiles").select("full_name, email").eq("id", id).maybeSingle();
  if (!p) notFound();
  const { data: enrolments } = await admin
    .from("enrolments")
    .select("id")
    .eq("learner_id", id)
    .is("unassigned_at", null)
    .order("assigned_at");
  const details = (await Promise.all((enrolments ?? []).map((e) => getEnrolmentDetail(e.id)))).filter((d) => d !== null);
  return resultsPdfResponse(
    { learnerName: p.full_name, learnerEmail: p.email, courses: details, generatedAt: new Date().toISOString(), generatedBy: profile.fullName },
    req.nextUrl.searchParams.has("view"),
  );
}

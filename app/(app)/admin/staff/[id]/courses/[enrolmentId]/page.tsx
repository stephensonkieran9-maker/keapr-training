import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { timed } from "@/lib/timing";
import { getEnrolmentDetail } from "@/lib/admin/attempt-detail-data";
import { EnrolmentDetailView } from "@/components/admin/EnrolmentDetailView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Course detail · Keapr Training" };

export default async function EnrolmentDetailPage({ params }: { params: Promise<{ id: string; enrolmentId: string }> }) {
  await requireAdmin();
  const { id, enrolmentId } = await params;
  const d = await timed("enrolment detail", () => getEnrolmentDetail(enrolmentId));
  if (!d || d.learnerId !== id) notFound();
  return <EnrolmentDetailView d={d} staffId={id} />;
}

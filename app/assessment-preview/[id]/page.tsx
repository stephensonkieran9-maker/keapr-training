import { notFound } from "next/navigation";
import { PreviewTest } from "@/components/assessment/admin/PreviewTest";
import { requireAdmin } from "@/lib/auth";
import { getAssessment } from "@/lib/assessment/admin";
import { signPhotoUrls } from "@/lib/assessment/photos";
import { formFieldIds } from "@/lib/assessment/scoring";

export const dynamic = "force-dynamic";
export const metadata = { title: "Preview assessment · Keapr Training" };

/** Full-screen admin preview of the candidate test. Nothing is saved. */
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const a = await getAssessment(id);
  if (!a) notFound();
  const now = Date.now();
  return (
    <PreviewTest
      id={a.id}
      title={a.title}
      caseStudy={a.caseStudy}
      fieldIds={formFieldIds(a.config)}
      deadlineAt={new Date(now + a.timeLimitMinutes * 60_000).toISOString()}
      serverNow={now}
      photoUrls={await signPhotoUrls(a.config.photos ?? [])}
    />
  );
}

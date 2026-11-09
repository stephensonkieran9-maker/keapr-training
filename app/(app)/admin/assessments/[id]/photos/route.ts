import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAssessment } from "@/lib/assessment/admin";
import { photoZip, zipResponse } from "@/lib/assessment/photos";

export const dynamic = "force-dynamic";

/** The same zip candidates get, for admins previewing the test. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const a = await getAssessment((await params).id);
  if (!a?.config.photos?.length) return new NextResponse("No photos yet", { status: 404 });
  return zipResponse(await photoZip(a.config.photos, `preview-${Date.now()}`), "property-photos.zip");
}

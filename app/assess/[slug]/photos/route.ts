import { NextResponse } from "next/server";
import { photoZip, zipResponse } from "@/lib/assessment/photos";
import { cleanConfig } from "@/lib/assessment/scoring";
import { attemptRowForCandidate, currentCandidate, getAssessmentBySlug } from "@/lib/assessment/server";

export const dynamic = "force-dynamic";

/** The property photos as a zip, for a candidate whose test is running. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const a = await getAssessmentBySlug((await params).slug);
  if (!a) return new NextResponse("Not found", { status: 404 });
  const c = await currentCandidate(a.id);
  if (!c) return new NextResponse("Please sign in again.", { status: 401 });
  const row = await attemptRowForCandidate(c.id);
  if (!row || row.submitted_at) return new NextResponse("The test isn't running.", { status: 403 });
  const photos = cleanConfig(row.config_snapshot).photos ?? [];
  if (!photos.length) return new NextResponse("This assessment has no photos.", { status: 404 });
  return zipResponse(await photoZip(photos, row.id), "property-photos.zip");
}

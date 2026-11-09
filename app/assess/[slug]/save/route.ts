import { NextResponse, type NextRequest } from "next/server";
import { candidateRequest } from "@/lib/assessment/route-helpers";
import { saveAnswers } from "@/lib/assessment/server";

export const dynamic = "force-dynamic";

/** Autosave. Answers are cleaned against the attempt's own field list. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const r = await candidateRequest(req, (await params).slug);
  if (!r.ok) return r.res;
  const result = await saveAnswers(r.candidate.id, r.body.answers);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}

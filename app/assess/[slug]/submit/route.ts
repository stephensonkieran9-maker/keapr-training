import { NextResponse, type NextRequest } from "next/server";
import { candidateRequest } from "@/lib/assessment/route-helpers";
import { submitAnswers } from "@/lib/assessment/server";

export const dynamic = "force-dynamic";

/** Final submission (the Submit button, or the timer reaching zero). The
 * server decides whether it was on time; the browser can't. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const r = await candidateRequest(req, (await params).slug);
  if (!r.ok) return r.res;
  const result = await submitAnswers(r.candidate.id, r.body.answers, r.body.kind === "timeout" ? "timeout" : "candidate");
  return NextResponse.json(result, { status: result.ok ? 200 : 409, headers: { "Cache-Control": "no-store" } });
}

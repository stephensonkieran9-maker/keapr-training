import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { currentCandidate, getAssessmentBySlug, type Candidate } from "./server";

const MAX_BODY = 200_000;

/** Shared checks for the candidate save/submit endpoints: same-site request,
 * a valid assessment, a signed-in candidate and a small JSON body. */
export async function candidateRequest(req: NextRequest, slug: string): Promise<
  { ok: true; candidate: Candidate; body: Record<string, unknown> } | { ok: false; res: NextResponse }
> {
  const fail = (status: number, error: string) => ({ ok: false as const, res: NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } }) });
  const origin = req.headers.get("origin");
  if (origin) {
    let host = "";
    try { host = new URL(origin).host; } catch { /* "null" or junk */ }
    if (host !== req.headers.get("host")) return fail(403, "cross-site");
  }
  const a = await getAssessmentBySlug(slug);
  if (!a) return fail(404, "not-found");
  const candidate = await currentCandidate(a.id);
  if (!candidate) return fail(401, "signed-out");
  const text = await req.text();
  if (text.length > MAX_BODY) return fail(413, "too-large");
  try {
    const body = JSON.parse(text);
    if (!body || typeof body !== "object") return fail(400, "bad-body");
    return { ok: true, candidate, body };
  } catch {
    return fail(400, "bad-body");
  }
}

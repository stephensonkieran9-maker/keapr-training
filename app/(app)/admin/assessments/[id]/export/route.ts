import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAssessment, loadCandidateRows } from "@/lib/assessment/admin";
import { candidatesCsv } from "@/lib/assessment/scoring";

export const dynamic = "force-dynamic";

/** Ranked results as a spreadsheet: accuracy first, then speed. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const a = await getAssessment(id);
  if (!a) return new NextResponse("Not found", { status: 404 });
  const csv = candidatesCsv(await loadCandidateRows(a.id));
  const name = `${a.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)}-results-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

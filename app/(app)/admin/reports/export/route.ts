import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { loadReportInput } from "@/lib/admin/report-data";
import { attemptsCsv, buildAttempts, buildReport, filterReport, parseFilters, reportCsv } from "@/lib/admin/report";

export const dynamic = "force-dynamic";

/** CSV download of the report, using the same filters as the page.
 * ?type=attempts exports every quiz attempt for the filtered rows instead. */
export async function GET(req: NextRequest) {
  await requireAdmin();
  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const filters = parseFilters(sp);
  const input = await loadReportInput();
  const rows = filterReport(buildReport(input), filters);

  const attempts = sp.type === "attempts";
  const body = attempts ? attemptsCsv(buildAttempts(input, new Set(rows.map((r) => r.enrolmentId)))) : reportCsv(rows);
  const date = new Date().toISOString().slice(0, 10);
  const name = `keapr-training-${attempts ? "quiz-attempts" : "progress"}-${date}.csv`;

  // Byte order mark so Excel opens names with accents correctly.
  return new NextResponse("﻿" + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

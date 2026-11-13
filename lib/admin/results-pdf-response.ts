import "server-only";
import { NextResponse } from "next/server";
import { buildResultsPdf, resultsFileName, type ResultsPdfInput } from "./results-pdf.ts";

/** Render results and send them as a PDF download (or inline with ?view=1). */
export async function resultsPdfResponse(input: ResultsPdfInput, inline: boolean) {
  const bytes = await buildResultsPdf(input);
  const one = input.courses.length === 1 ? input.courses[0].courseTitle : null;
  const name = resultsFileName(input.learnerName, one, input.generatedAt);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

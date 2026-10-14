"use server";

import { requireAdmin } from "@/lib/auth";
import { getCourseForEditor } from "./queries";
import { scorePreview, type PreviewScore } from "./preview.ts";

/** Scores a preview quiz against the saved draft. Records nothing. */
export async function previewQuiz(courseId: string, lessonIndex: number, answers: Record<string, string>): Promise<PreviewScore> {
  await requireAdmin();
  const course = await getCourseForEditor(courseId);
  if (!course) return { ok: false, error: "Course not found." };
  return scorePreview(course.draft, Number(lessonIndex), answers);
}

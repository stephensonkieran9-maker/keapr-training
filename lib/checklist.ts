import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ChecklistItem {
  id: string;
  section: string;
  label: string;
  /** Set when the item also shows on a lesson's page. */
  lessonId: string | null;
  tickedAt: string | null;
}

export interface ChecklistSection {
  title: string;
  items: ChecklistItem[];
}

/** A course version's checklist with one enrolment's ticks. Empty if the
 * course has no checklist (or migration 0015 hasn't been run). */
export async function loadChecklist(supabase: SupabaseClient, courseVersionId: string, enrolmentId: string): Promise<ChecklistItem[]> {
  const query = (columns: string) =>
    supabase.from("course_checklist_items").select(columns).eq("course_version_id", courseVersionId).order("position");
  let res = await query("id, position, section, label, lesson_id");
  if (res.error) res = await query("id, position, section, label");
  const items = res.data as unknown as { id: string; section: string | null; label: string; lesson_id?: string | null }[] | null;
  if (res.error || !items?.length) return [];
  const { data: ticks } = await supabase.from("checklist_ticks").select("item_id, ticked_at").eq("enrolment_id", enrolmentId);
  const ticked = new Map((ticks ?? []).map((t) => [t.item_id as string, t.ticked_at as string]));
  return items.map((i) => ({ id: i.id, section: i.section ?? "", label: i.label, lessonId: i.lesson_id ?? null, tickedAt: ticked.get(i.id) ?? null }));
}

/** Groups items under their headings, keeping order. */
export function groupChecklist(items: ChecklistItem[]): ChecklistSection[] {
  const sections: ChecklistSection[] = [];
  for (const item of items) {
    const last = sections[sections.length - 1];
    if (last && last.title === item.section) last.items.push(item);
    else sections.push({ title: item.section, items: [item] });
  }
  return sections;
}

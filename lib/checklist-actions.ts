"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "./auth";
import { createAdminClient } from "./supabase/admin";

/** Ticks or unticks a checklist item for the signed-in learner. The database
 * checks the item belongs to a course they're assigned. */
export async function setChecklistTick(itemId: string, ticked: boolean): Promise<{ ok: boolean; error?: string }> {
  const { profile } = await requireProfile();
  const { error } = await createAdminClient().rpc("set_checklist_tick", { p_learner: profile.id, p_item: itemId, p_ticked: ticked });
  if (error) {
    if (!/NOT_ENROLLED/.test(error.message)) console.error(`[checklist] tick failed: ${error.message}`);
    return { ok: false, error: "That didn't save. Check your connection and try again." };
  }
  revalidatePath("/courses", "layout");
  revalidatePath("/lessons", "layout");
  return { ok: true };
}

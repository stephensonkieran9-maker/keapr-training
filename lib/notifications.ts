import "server-only";
import { createAdminClient } from "./supabase/admin";

export type NotificationKind =
  | "welcome"
  | "course_assigned"
  | "course_removed"
  | "progress_reset"
  | "lesson_marked"
  | "course_completed"
  | "problem_report";

export interface NewNotification {
  kind: NotificationKind;
  title: string;
  body?: string;
  link?: string;
}

/** Sends in-app notifications. Never throws: a failed notification must not
 * undo or block the action that triggered it. */
export async function notify(userIds: string | string[], n: NewNotification): Promise<void> {
  const ids = [...new Set(Array.isArray(userIds) ? userIds : [userIds])].filter(Boolean);
  if (!ids.length) return;
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("notifications").insert(
      ids.map((user_id) => ({
        user_id,
        kind: n.kind,
        title: n.title.slice(0, 200),
        body: n.body?.slice(0, 1000) ?? null,
        link: n.link?.startsWith("/") ? n.link : null,
      })),
    );
    if (error) console.warn(`[notify] ${n.kind} not sent: ${error.message}${/notifications/.test(error.message) ? " (run migration 0008)" : ""}`);
  } catch (e) {
    console.warn(`[notify] ${n.kind} not sent: ${(e as Error).message}`);
  }
}

/** Sends to every active admin, optionally leaving one person out. */
export async function notifyAdmins(n: NewNotification, except?: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("profiles").select("id").eq("role", "admin").eq("is_active", true);
    await notify((data ?? []).map((p) => p.id).filter((id) => id !== except), n);
  } catch (e) {
    console.warn(`[notify] admins not notified: ${(e as Error).message}`);
  }
}

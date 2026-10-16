"use server";

import { requireProfile } from "./auth";
import { createAdminClient } from "./supabase/admin";
import { notifyAdmins } from "./notifications";

export interface NotificationItem {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  createdAt: string;
  read: boolean;
}

const LIMIT = 20;

/** The signed-in person's latest notifications, read through their own
 * session (row-level security limits it to theirs). */
export async function getMyNotifications(): Promise<{ items: NotificationItem[]; unread: number; available: boolean }> {
  const { profile, supabase } = await requireProfile();
  const [list, count] = await Promise.all([
    supabase.from("notifications").select("id, kind, title, body, link, created_at, read_at").order("created_at", { ascending: false }).limit(LIMIT),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", profile.id).is("read_at", null),
  ]);
  if (list.error) return { items: [], unread: 0, available: false }; // migration 0008 not run yet
  return {
    available: true,
    unread: count.count ?? 0,
    items: (list.data ?? []).map((n) => ({
      id: n.id,
      kind: n.kind,
      title: n.title,
      body: n.body,
      link: n.link,
      createdAt: n.created_at,
      read: Boolean(n.read_at),
    })),
  };
}

/** Marks the given notifications (or all of them) as read. */
export async function markNotificationsRead(ids: string[] | "all"): Promise<void> {
  const { profile, supabase } = await requireProfile();
  let q = supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", profile.id).is("read_at", null);
  if (ids !== "all") {
    const clean = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 50);
    if (!clean.length) return;
    q = q.in("id", clean);
  }
  await q;
}

export interface ReportState {
  ok?: boolean;
  error?: string;
}

const REPORTS_PER_HOUR = 5;

/** "Report a problem" on the Help page: notifies every admin. */
export async function reportProblem(_prev: ReportState, formData: FormData): Promise<ReportState> {
  const { profile } = await requireProfile();
  const message = String(formData.get("message") ?? "").trim();
  const where = String(formData.get("where") ?? "").trim().slice(0, 120);
  if (message.length < 5) return { error: "Tell us a bit more about what went wrong." };
  if (message.length > 1000) return { error: "Keep it under 1,000 characters." };

  const admin = createAdminClient();
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await admin
    .from("audit_events")
    .select("id", { count: "exact", head: true })
    .eq("actor_id", profile.id)
    .eq("action", "report_problem")
    .gte("created_at", since);
  if ((count ?? 0) >= REPORTS_PER_HOUR) return { error: "You've sent a few reports in the last hour. Please speak to your manager directly." };

  await admin.from("audit_events").insert({
    actor_id: profile.id,
    action: "report_problem",
    target_type: "profile",
    target_id: profile.id,
    details: { message, where },
  });
  await notifyAdmins(
    {
      kind: "problem_report",
      title: `${profile.fullName} reported a problem`,
      body: where ? `${where}: ${message}` : message,
      link: `/admin/staff/${profile.id}`,
    },
  );
  return { ok: true };
}

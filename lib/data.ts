import { demoDashboard } from "./demo-data";
import type { DashboardData } from "./types";

// Single entry point for dashboard data. Today it returns demo content.
// Next step: when Supabase env vars are set, load the signed-in learner's
// enrolments, progress and next lesson here (server-side only).
export async function getDashboardData(): Promise<DashboardData> {
  return demoDashboard;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatShortDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function percent(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

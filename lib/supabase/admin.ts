import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

// Service-role client: bypasses row-level security. Server-only, and only
// for operations that have already checked permissions in code (scoring
// quizzes, recording completions, admin actions).
export function createAdminClient() {
  // Trim: a stray space or line break pasted into Vercel makes every
  // request fail (and the client then retries for ~7 seconds).
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in Vercel.");
  return createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Throws a readable error (and logs the detail) when an admin query fails,
 * instead of quietly showing an empty list. */
export function check<T>(label: string, result: { data: T | null; error: { message: string; code?: string } | null }): T {
  if (result.error) {
    console.error(`[admin] ${label} failed: ${result.error.code ?? ""} ${result.error.message}`);
    throw new Error(`Couldn't load ${label}: ${result.error.message}`);
  }
  if (result.data === null) throw new Error(`Couldn't load ${label}: no data returned`);
  return result.data;
}

import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Learner } from "./types";

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  role: "learner" | "admin";
  isActive: boolean;
}

// Returns the signed-in, active user's profile, or sends them to sign in.
// Every protected page calls this on the server; the middleware redirect is
// a convenience, not the security boundary.
// Cached per request, so the layout and the page share one lookup.
export const requireProfile = cache(async function requireProfile(): Promise<{ profile: Profile; supabase: Awaited<ReturnType<typeof createClient>> }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    await supabase.auth.signOut();
    redirect("/login?error=no-profile");
  }
  if (!data.is_active) {
    await supabase.auth.signOut();
    redirect("/login?error=inactive");
  }

  return {
    supabase,
    profile: {
      id: data.id,
      fullName: data.full_name,
      email: data.email,
      role: data.role,
      isActive: data.is_active,
    },
  };
});

export async function requireAdmin() {
  const result = await requireProfile();
  if (result.profile.role !== "admin") redirect("/dashboard");
  return result;
}

export function learnerFromProfile(profile: Profile): Learner {
  const firstName = profile.fullName.split(" ")[0] || profile.fullName;
  return {
    id: profile.id,
    firstName,
    initial: firstName.charAt(0).toUpperCase(),
    team: profile.role === "admin" ? "Administrator" : "Learner",
    isAdmin: profile.role === "admin",
  };
}

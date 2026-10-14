import { AppShell } from "@/components/AppShell";
import { learnerFromProfile, requireProfile } from "@/lib/auth";
import { demoDashboard } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Shared shell for every signed-in page. Layouts persist across navigation,
// so switching tabs only loads the page content, not the sidebar and profile.
export default async function SignedInLayout({ children }: { children: React.ReactNode }) {
  const learner = isSupabaseConfigured() ? learnerFromProfile((await requireProfile()).profile) : demoDashboard.learner;
  return <AppShell learner={learner}>{children}</AppShell>;
}

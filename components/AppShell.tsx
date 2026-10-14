import { Sidebar } from "./Sidebar";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { TopBar } from "./TopBar";
import type { Learner } from "@/lib/types";

export function AppShell({
  learner,
  demoMode = false,
  children,
}: {
  learner: Learner;
  demoMode?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="app">
      <Sidebar learner={learner} demoMode={demoMode} canSignOut={isSupabaseConfigured()} />
      <div className="main">
        <div className="mobile-nav">
          <span className="mark">K</span>Keapr Training
          <span className="avatar" aria-hidden="true">{learner.initial}</span>
        </div>
        <TopBar />
        <main className="wrap">{children}</main>
      </div>
    </div>
  );
}

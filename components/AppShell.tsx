import { Sidebar, type NavKey } from "./Sidebar";
import { TopBar } from "./TopBar";
import type { Learner } from "@/lib/types";

export function AppShell({
  learner,
  active,
  children,
}: {
  learner: Learner;
  active: NavKey;
  children: React.ReactNode;
}) {
  return (
    <div className="app">
      <Sidebar learner={learner} active={active} />
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

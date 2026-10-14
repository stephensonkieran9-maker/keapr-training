import Link from "next/link";
import { Icon, type IconName } from "./Icons";
import type { Learner } from "@/lib/types";
import { signOut } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type NavKey = "dashboard" | "training" | "resources" | "help" | "staff" | "courses";

const learningLinks: { key: NavKey; label: string; href: string; icon: IconName }[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: "grid" },
  { key: "training", label: "My training", href: "/dashboard#my-training", icon: "cap" },
  { key: "resources", label: "Resources", href: "/dashboard#resources", icon: "folder" },
  { key: "help", label: "Help", href: "#", icon: "help" },
];

export function Sidebar({ learner, active, demoMode = false }: { learner: Learner; active: NavKey; demoMode?: boolean }) {
  const base = demoMode ? "/demo" : "/dashboard";
  const links = learningLinks.map((l) => ({ ...l, href: l.href.replace("/dashboard", base) }));
  const canSignOut = !demoMode && isSupabaseConfigured();
  return (
    <aside className="side" aria-label="Main navigation">
      <div className="brand">
        <span className="mark">K</span>
        <span>
          Keapr<small>Training</small>
        </span>
      </div>

      <div className="navlabel">Learning</div>
      <ul className="nav">
        {links.map((l) => (
          <li key={l.key}>
            <Link href={l.href} aria-current={active === l.key ? "page" : undefined}>
              <Icon name={l.icon} />
              {l.label}
            </Link>
          </li>
        ))}
      </ul>

      {learner.isAdmin && !demoMode && (
        <>
          <div className="navlabel" style={{ marginTop: 24 }}>Admin</div>
          <ul className="nav">
            <li>
              <Link href="/admin/staff" aria-current={active === "staff" ? "page" : undefined}>
                <Icon name="users" />
                Staff
              </Link>
            </li>
            <li>
              <Link href="/admin/courses" aria-current={active === "courses" ? "page" : undefined}>
                <Icon name="book" />
                Courses
              </Link>
            </li>
          </ul>
        </>
      )}

      <div className="me">
        <span className="avatar" aria-hidden="true">{learner.initial}</span>
        <div>
          {learner.firstName}
          <small>{learner.team}</small>
        </div>
        {canSignOut ? (
          <form action={signOut} className="signout">
            <button className="iconbtn" type="submit" aria-label="Sign out">
              <Icon name="out" />
            </button>
          </form>
        ) : demoMode ? (
          <Link className="iconbtn" href="/login" aria-label="Sign in">
            <Icon name="out" />
          </Link>
        ) : null}
      </div>
    </aside>
  );
}

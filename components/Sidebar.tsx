import Link from "next/link";
import { Icon, type IconName } from "./Icons";
import type { Learner } from "@/lib/types";

export type NavKey = "dashboard" | "training" | "resources" | "help" | "admin";

const learningLinks: { key: NavKey; label: string; href: string; icon: IconName }[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: "grid" },
  { key: "training", label: "My training", href: "/dashboard#my-training", icon: "cap" },
  { key: "resources", label: "Resources", href: "/dashboard#resources", icon: "folder" },
  { key: "help", label: "Help", href: "#", icon: "help" },
];

export function Sidebar({ learner, active }: { learner: Learner; active: NavKey }) {
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
        {learningLinks.map((l) => (
          <li key={l.key}>
            <Link href={l.href} aria-current={active === l.key ? "page" : undefined}>
              <Icon name={l.icon} />
              {l.label}
            </Link>
          </li>
        ))}
      </ul>

      {learner.isAdmin && (
        <>
          <div className="navlabel" style={{ marginTop: 24 }}>Admin</div>
          <ul className="nav">
            <li>
              <Link href="#" aria-current={active === "admin" ? "page" : undefined}>
                <Icon name="users" />
                Staff &amp; reporting
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
        <button className="iconbtn" aria-label="Sign out">
          <Icon name="out" />
        </button>
      </div>
    </aside>
  );
}

import Link from "next/link";
import { Icon } from "./Icons";
import type { DashboardData } from "@/lib/types";

export function Welcome({ data }: { data: DashboardData }) {
  const inProgress = data.courses.filter((c) => c.status === "in_progress").length;
  const notStarted = data.courses.filter((c) => c.status === "not_started").length;
  const passed = data.courses.reduce((n, c) => n + c.lessonsPassed, 0);
  const total = data.courses.reduce((n, c) => n + c.lessonCount, 0);

  const summary =
    data.courses.length === 0
      ? "No training has been assigned to you yet. Your manager will let you know when it has."
      : `Pick up where you left off. You have ${inProgress} ${inProgress === 1 ? "course" : "courses"} in progress and ${notStarted} not yet started.`;

  return (
    <section className="welcome">
      <div>
        <div className="eyebrow">
          Your training · <b>{data.termLabel}</b>
          {data.isDemo && (
            <>
              {" "}
              <span className="demo">Demo content</span>
            </>
          )}
        </div>
        <h1>Welcome back, {data.learner.firstName}</h1>
        <p>{summary}</p>
      </div>
      <div className="actions">
        <div className="metric">
          Lessons passed<strong>{passed} of {total}</strong>
        </div>
        <Link className="btn btn-ghost" href="#resources">
          <Icon name="folder" />
          Resources
        </Link>
        <Link className="btn btn-primary" href="#">
          <Icon name="help" />
          Ask for help
        </Link>
      </div>
    </section>
  );
}

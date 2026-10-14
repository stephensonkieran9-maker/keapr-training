import { Icon } from "./Icons";
import { formatShortDate } from "@/lib/format";
import type { CourseSummary, NextLesson } from "@/lib/types";

export function StatTiles({ courses, nextLesson }: { courses: CourseSummary[]; nextLesson: NextLesson | null }) {
  const inProgress = courses.filter((c) => c.status === "in_progress").length;
  const completed = courses.filter((c) => c.status === "completed");
  const latest = completed
    .map((c) => c.completedOn)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1);

  return (
    <section className="stats" aria-label="Training summary">
      <div className="stat">
        <div>
          <div className="k">Assigned courses</div>
          <div className="v">{courses.length}</div>
          <div className="s">Set by your manager</div>
        </div>
        <span className="ic"><Icon name="stack" /></span>
      </div>
      <div className="stat">
        <div>
          <div className="k">In progress</div>
          <div className="v">{inProgress}</div>
          <div className="s">{nextLesson ? `Next quiz: Lesson ${nextLesson.position}` : "Nothing in progress"}</div>
        </div>
        <span className="ic"><Icon name="progress" /></span>
      </div>
      <div className="stat">
        <div>
          <div className="k">Completed</div>
          <div className="v">{completed.length}</div>
          <div className={latest ? "s ok" : "s"}>{latest ? `Completed ${formatShortDate(latest)}` : "None yet"}</div>
        </div>
        <span className="ic ok"><Icon name="award" /></span>
      </div>
    </section>
  );
}

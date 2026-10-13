"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "./Icons";
import { ProgressBar } from "./ProgressBar";
import { formatShortDate, percent } from "@/lib/data";
import type { CourseStatus, CourseSummary } from "@/lib/types";

type Filter = "all" | CourseStatus;

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "in_progress", label: "In progress" },
  { key: "not_started", label: "Not started" },
  { key: "completed", label: "Completed" },
];

export function CourseGrid({ courses }: { courses: CourseSummary[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const count = (f: Filter) => (f === "all" ? courses.length : courses.filter((c) => c.status === f).length);
  const shown = filter === "all" ? courses : courses.filter((c) => c.status === filter);

  return (
    <section id="my-training" aria-labelledby="mt-title">
      <div className="sec-head">
        <div>
          <h2 id="mt-title">My training</h2>
          <p>All courses assigned to you.</p>
        </div>
        <div className="tabs" role="group" aria-label="Filter courses">
          {filters.map((f) => (
            <button key={f.key} aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label} ({count(f.key)})
            </button>
          ))}
        </div>
      </div>

      {courses.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No courses have been assigned to you yet.</p>
      ) : (
        <div className="grid">
          {shown.map((c) => (
            <CourseCard key={c.enrolmentId} course={c} />
          ))}
        </div>
      )}
    </section>
  );
}

function CourseCard({ course }: { course: CourseSummary }) {
  const pct = percent(course.lessonsPassed, course.lessonCount);
  const href = `/courses/${course.courseId}`;

  const status =
    course.status === "completed" ? (
      <span className="status done">Completed{course.completedOn ? ` ${formatShortDate(course.completedOn)}` : ""}</span>
    ) : course.status === "in_progress" ? (
      <span className="status prog">In progress</span>
    ) : (
      <span className="status none">Not started</span>
    );

  const action =
    course.status === "completed" ? (
      <Link className="btn btn-soft" href={href}>Review<Icon name="redo" /></Link>
    ) : course.status === "in_progress" ? (
      <Link className="btn btn-primary" href={href}>Continue<Icon name="arrow" /></Link>
    ) : (
      <Link className="btn btn-ghost" href={href}>Start course<Icon name="play" /></Link>
    );

  return (
    <article className="course">
      <div className="row">
        {status}
        <span>{course.lessonCount} lessons · {course.durationMinutes} min</span>
      </div>
      <h3>{course.title}</h3>
      <p>{course.description}</p>
      <div className="foot">
        <ProgressBar label="Progress" value={pct} valueLabel={`${pct}% (${course.lessonsPassed}/${course.lessonCount})`} />
        {action}
      </div>
    </article>
  );
}

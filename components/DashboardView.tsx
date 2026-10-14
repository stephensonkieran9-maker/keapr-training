import { AppShell } from "./AppShell";
import { Welcome } from "./Welcome";
import { NextLessonHero } from "./NextLessonHero";
import { StatTiles } from "./StatTiles";
import { LessonSteps } from "./LessonSteps";
import { CourseGrid } from "./CourseGrid";
import { ResourceList } from "./ResourceList";
import type { DashboardData } from "@/lib/types";

export function DashboardView({ data, demoMode = false }: { data: DashboardData; demoMode?: boolean }) {
  const current = data.courses.find((c) => c.enrolmentId === data.nextLesson?.enrolmentId);

  return (
    <AppShell learner={data.learner} active="dashboard" demoMode={demoMode}>
      <Welcome data={data} />
      {data.nextLesson && <NextLessonHero lesson={data.nextLesson} isDemo={data.isDemo} />}
      {data.courses.length > 0 && <StatTiles courses={data.courses} nextLesson={data.nextLesson} />}
      {current && data.currentCourseSteps.length > 0 && (
        <LessonSteps
          courseTitle={current.title}
          steps={data.currentCourseSteps}
          passMarkPercent={data.passMarkPercent}
          requiredWatchPercent={data.nextLesson?.requiredWatchPercent ?? 90}
        />
      )}
      <CourseGrid courses={data.courses} />
      {data.resources.length > 0 && <ResourceList resources={data.resources} />}
    </AppShell>
  );
}

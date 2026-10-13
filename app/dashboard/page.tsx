import { AppShell } from "@/components/AppShell";
import { Welcome } from "@/components/Welcome";
import { NextLessonHero } from "@/components/NextLessonHero";
import { StatTiles } from "@/components/StatTiles";
import { LessonSteps } from "@/components/LessonSteps";
import { CourseGrid } from "@/components/CourseGrid";
import { ResourceList } from "@/components/ResourceList";
import { getDashboardData } from "@/lib/data";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const current = data.courses.find((c) => c.enrolmentId === data.nextLesson?.enrolmentId);

  return (
    <AppShell learner={data.learner} active="dashboard">
      <Welcome data={data} />
      {data.nextLesson && <NextLessonHero lesson={data.nextLesson} isDemo={data.isDemo} />}
      <StatTiles courses={data.courses} nextLesson={data.nextLesson} />
      {current && (
        <LessonSteps
          courseTitle={current.title}
          steps={data.currentCourseSteps}
          passMarkPercent={data.passMarkPercent}
          requiredWatchPercent={data.nextLesson?.requiredWatchPercent ?? 90}
        />
      )}
      <CourseGrid courses={data.courses} />
      <ResourceList resources={data.resources} />
    </AppShell>
  );
}

// SAMPLE DATA ONLY for the public /demo/admin preview. Invented people and
// activity, generated deterministically so the preview looks the same each time.
import type { OverviewInput } from "./overview.ts";

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function sampleOverviewInput(now = new Date()): OverviewInput {
  const r = rng(42);
  const DAY = 86_400_000;
  const t = (daysAgo: number) => new Date(now.getTime() - daysAgo * DAY - Math.floor(r() * 8) * 3_600_000).toISOString();

  const courseDefs: [string, number][] = [
    ["Welcome to Keapr", 4],
    ["Guest and Booking Operations", 8],
    ["Property Operations", 6],
    ["Owner Communications", 4],
  ];
  const courses = courseDefs.map(([title, n], ci) => ({
    versionId: `v${ci}`,
    courseId: `c${ci}`,
    title,
    lessons: Array.from({ length: n }, (_, li) => ({ id: `c${ci}l${li}`, title: `${title}: lesson ${li + 1}`, position: li + 1, isRequired: true })),
  }));

  const names = ["Sample Learner A", "Sample Learner B", "Sample Learner C", "Sample Learner D", "Sample Learner E", "Sample Learner F", "Sample Learner G", "Sample Learner H", "Sample Learner J"];
  // How far through each course each person is (fraction of lessons), -1 = not assigned
  const plan = [
    [1, 1, 0.5, -1],
    [1, 0.75, 0.33, 0],
    [1, 0.25, -1, -1],
    [1, 1, 1, 0.5],
    [0.5, 0, -1, -1],
    [1, 0.5, 0.5, -1],
    [0, 0, -1, -1],
    [1, 0.875, 0.17, 0.25],
    [0.75, -1, -1, -1],
  ];

  const people = names.map((name, i) => ({
    id: `p${i}`,
    name,
    role: "learner" as const,
    isActive: true,
    lastSignInAt: i === 6 ? null : t(Math.floor(r() * 5)),
    createdAt: t(25 + i),
  }));

  const enrolments: OverviewInput["enrolments"] = [];
  const completions: OverviewInput["completions"] = [];
  const attempts: OverviewInput["attempts"] = [];
  const videoActivity: OverviewInput["videoActivity"] = [];

  plan.forEach((row, pi) => {
    row.forEach((frac, ci) => {
      if (frac < 0) return;
      const course = courses[ci];
      const id = `e${pi}-${ci}`;
      const done = Math.round(frac * course.lessons.length);
      enrolments.push({ id, learnerId: `p${pi}`, versionId: course.versionId, assignedAt: t(24 - ci * 3), completedAt: done === course.lessons.length ? t(2 + Math.floor(r() * 10)) : null });
      for (let li = 0; li < done; li++) {
        const lesson = course.lessons[li];
        const day = Math.max(0, 22 - ci * 4 - li * 2 + Math.floor(r() * 3) - (pi % 3));
        // Lesson 3 of Guest Ops is the tricky one in the sample
        const fails = ci === 1 && li === 2 ? 1 + Math.floor(r() * 2) : r() < 0.18 ? 1 : 0;
        for (let f = 0; f < fails; f++) attempts.push({ enrolmentId: id, lessonId: lesson.id, passed: false, submittedAt: t(day + 1) });
        attempts.push({ enrolmentId: id, lessonId: lesson.id, passed: true, submittedAt: t(day) });
        completions.push({ enrolmentId: id, lessonId: lesson.id, completedAt: t(day) });
        videoActivity.push({ enrolmentId: id, lessonId: lesson.id, updatedAt: t(day) });
      }
      // Someone stuck on the tricky lesson
      if (pi === 2 && ci === 1) {
        for (let f = 0; f < 3; f++) attempts.push({ enrolmentId: id, lessonId: course.lessons[2].id, passed: false, submittedAt: t(3 - f) });
      }
      if (pi === 4 && ci === 0) videoActivity.push({ enrolmentId: id, lessonId: course.lessons[2].id, updatedAt: t(12) });
    });
  });

  return { now, people, courses, enrolments, completions, attempts, videoActivity };
}

// Shapes the dashboard components render. These mirror what the
// Supabase queries will return, so swapping demo data for real data
// means changing lib/data.ts, not the components.

export type CourseStatus = "not_started" | "in_progress" | "completed";
export type LessonState = "passed" | "available" | "locked";

export interface Learner {
  id: string;
  firstName: string;
  initial: string;
  team: string;
  isAdmin: boolean;
}

export interface CourseSummary {
  enrolmentId: string;
  courseId: string;
  title: string;
  description: string;
  status: CourseStatus;
  lessonCount: number;
  lessonsPassed: number;
  durationMinutes: number;
  completedOn?: string; // ISO date
  /** Training path: title of the course to finish first. */
  lockedBy?: string;
}

export interface LessonStep {
  lessonId: string;
  position: number;
  title: string;
  state: LessonState;
  bestScorePercent?: number;
  estimatedMinutes?: number;
  lockedReason?: string;
}

export interface NextLesson {
  enrolmentId: string;
  lessonId: string;
  courseTitle: string;
  lessonTitle: string;
  description: string;
  position: number;
  lessonCount: number;
  lessonsPassed: number;
  videoSeconds: number;
  watchedSeconds: number;
  requiredWatchPercent: number;
  /** false = watch-only lesson: completes when watched, no quiz. */
  hasQuiz?: boolean;
  /** "reading" = no video: read, confirm, then the quiz. */
  kind?: "video" | "reading";
}

export interface Resource {
  id: string;
  title: string;
  kind: "pdf" | "doc" | "checklist";
  sizeLabel?: string;
  href: string;
}

export interface DashboardData {
  isDemo: boolean;
  termLabel: string;
  learner: Learner;
  nextLesson: NextLesson | null;
  currentCourseSteps: LessonStep[];
  passMarkPercent: number;
  courses: CourseSummary[];
  resources: Resource[];
}

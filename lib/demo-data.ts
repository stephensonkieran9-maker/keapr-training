import type { DashboardData } from "./types";

// DEMONSTRATION CONTENT ONLY. None of this is approved Keapr training
// material or policy. Replace with real data from Supabase.
export const demoDashboard: DashboardData = {
  isDemo: true,
  termLabel: "Autumn 2026",
  learner: {
    id: "demo-learner",
    firstName: "Kieran",
    initial: "K",
    team: "Operations",
    isAdmin: true,
  },
  passMarkPercent: 80,
  nextLesson: {
    enrolmentId: "enr-guest-ops",
    lessonId: "les-guest-3",
    courseTitle: "Guest and Booking Operations",
    lessonTitle: "Handling guest enquiries and late check-outs",
    description:
      "Placeholder description. Approved lesson objectives will appear here once the operations team supplies the training material.",
    position: 3,
    lessonCount: 8,
    lessonsPassed: 2,
    videoSeconds: 375,
    watchedSeconds: 160,
    requiredWatchPercent: 90,
  },
  currentCourseSteps: [
    { lessonId: "les-guest-1", position: 1, title: "Introduction to guest messaging", state: "passed", bestScorePercent: 100 },
    { lessonId: "les-guest-2", position: 2, title: "Pre-arrival and check-in", state: "passed", bestScorePercent: 90 },
    { lessonId: "les-guest-3", position: 3, title: "Handling guest enquiries and late check-outs", state: "available", estimatedMinutes: 12 },
    { lessonId: "les-guest-4", position: 4, title: "Noise complaints and escalation", state: "locked", lockedReason: "Pass the lesson 3 quiz to unlock" },
    { lessonId: "les-guest-5", position: 5, title: "Damage reports and deposits", state: "locked", lockedReason: "Pass the lesson 4 quiz to unlock" },
  ],
  courses: [
    { enrolmentId: "enr-guest-ops", courseId: "crs-guest", title: "Guest and Booking Operations", description: "Enquiries, reservations, guest communications and issue escalation.", status: "in_progress", lessonCount: 8, lessonsPassed: 2, durationMinutes: 48 },
    { enrolmentId: "enr-prop-ops", courseId: "crs-prop", title: "Property Operations", description: "Cleaner coordination, maintenance reporting and handovers.", status: "in_progress", lessonCount: 6, lessonsPassed: 3, durationMinutes: 42 },
    { enrolmentId: "enr-welcome", courseId: "crs-welcome", title: "Welcome to Keapr", description: "Company overview, services, staff responsibilities and internal tools.", status: "completed", lessonCount: 4, lessonsPassed: 4, durationMinutes: 25, completedOn: "2026-10-12" },
    { enrolmentId: "enr-onboard", courseId: "crs-onboard", title: "Property Onboarding", description: "Information collection, listing preparation and onboarding checks.", status: "not_started", lessonCount: 5, lessonsPassed: 0, durationMinutes: 35 },
    { enrolmentId: "enr-owner", courseId: "crs-owner", title: "Owner Communications", description: "Owner updates, handling requests and internal records.", status: "not_started", lessonCount: 4, lessonsPassed: 0, durationMinutes: 30 },
    { enrolmentId: "enr-sales", courseId: "crs-sales", title: "Sales and CRM", description: "Enquiries, contact records, follow-ups and appointment workflows.", status: "not_started", lessonCount: 5, lessonsPassed: 0, durationMinutes: 40 },
  ],
  resources: [
    { id: "res-1", title: "Staff handbook (placeholder)", kind: "pdf", sizeLabel: "PDF · 2.4 MB", href: "#" },
    { id: "res-2", title: "Guest messaging templates (placeholder)", kind: "doc", sizeLabel: "DOC · 1.1 MB", href: "#" },
    { id: "res-3", title: "Property onboarding checklist (placeholder)", kind: "checklist", sizeLabel: "Checklist", href: "#" },
  ],
};

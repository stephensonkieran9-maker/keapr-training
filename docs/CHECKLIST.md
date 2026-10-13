# Keapr Training build checklist

The working copy lives in the Claude doc "Keapr Training Build Checklist"; this file mirrors it for the repo. **Core** marks the watch → quiz → pass → unlock flow, which comes first.

## Done

- [x] Learner dashboard from the Stitch mockups (demo content)
- [x] Light and dark mode toggle, light by default
- [x] WordPress embed snippet for the demo
- [x] Next.js project with the dashboard split into components
- [x] Initial database schema and access policies (`supabase/migrations/0001_initial_schema.sql`)

## Foundations

- [ ] **Core** Create a development Supabase project and run the migration
- [ ] **Core** Seed data: one labelled demo course with three lessons and quizzes
- [ ] Import the repo into Vercel and confirm the preview link

## Sign-in and access

- [ ] **Core** Sign in, sign out and password reset
- [ ] **Core** Accept an invitation (no public sign-up); errors for expired invitations and inactive accounts
- [ ] **Core** Load the signed-in user's profile and role
- [ ] **Core** Server-side guards on admin pages, locked lessons and unassigned courses
- [ ] Save the light/dark choice to the user's profile

## Learner dashboard data

- [ ] **Core** Replace demo data in `lib/data.ts` with Supabase queries
- [ ] Course filter tabs and search
- [ ] Resources with signed download links
- [ ] Empty, loading and error states
- [ ] Notifications bell (or defer)

## Lesson player and video tracking

- [ ] **Core** Choose a video host that reports playback events
- [ ] **Core** Track unique watched ranges; skipping ahead doesn't count
- [ ] **Core** Save progress periodically, on pause and on leaving; resume from the saved position
- [ ] **Core** Unlock the quiz at 90% watched, checked on the server
- [ ] Objectives, notes, downloads and lesson sidebar
- [ ] Captions, keyboard controls, mobile playback, no autoplay with sound
- [ ] Visible error if tracking fails, plus an admin override

## Quizzes and progression

- [ ] **Core** Load questions without correct answers
- [ ] **Core** Show how many correct answers are needed before starting
- [ ] **Core** Require every question answered before submitting
- [ ] **Core** Score on the server; store the attempt with version, answers, score and pass mark
- [ ] **Core** Pass on the exact ratio, never a rounded score
- [ ] **Core** Record completion and unlock the next lesson in one transaction, with no duplicates
- [ ] **Core** Results screen with explanations, Continue or Review and retry
- [ ] **Core** A later failed retry never removes an earlier pass
- [ ] **Core** Course completes with a date when every required lesson is passed

## Admin tools

- [ ] Invite staff; see invitation status
- [ ] Assign and unassign courses; search staff
- [ ] Deactivate accounts, keeping training history
- [ ] Course and lesson editor with draft and published states
- [ ] Quiz editor with validation and pass mark per lesson
- [ ] Publish versioned snapshots
- [ ] Preview as a learner without recording progress
- [ ] Reporting with filters and CSV export
- [ ] Resets and overrides with a reason and audit record

## Before go-live

- [ ] Keep the current green theme unless told otherwise
- [ ] Approved training content to replace placeholders
- [ ] Automated tests for the 16 acceptance criteria
- [ ] Manual walkthrough on desktop, phone and keyboard only
- [ ] Short admin guide
- [ ] List external services still to configure (video host, invite emails)

Later, not in version one: email reminders, certificates, question banks, timed tests, advanced analytics, integrations.

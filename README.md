# Keapr Training

Private internal training app for Keapr staff: video lessons followed by quizzes, where passing a quiz unlocks the next lesson.

**Status:** sign-in and the learner dashboard are connected to Supabase. A public demo with sample data is at `/demo`. The lesson player, quizzes and admin tools are next. See [docs/CHECKLIST.md](docs/CHECKLIST.md).

## Stack

- Next.js 15 (App Router) + TypeScript
- Plain CSS with theme tokens in `app/globals.css` (light by default, dark via the toggle)
- Supabase for sign-in, the database and private file storage (not connected yet)
- Hosted on Vercel

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. It redirects to `/dashboard`.

## Deploy on Vercel

1. In Vercel, choose **Add New → Project** and import `keapr-training` from GitHub.
2. Keep the detected Next.js settings and deploy. No environment variables are needed while it runs on demo data.
3. Every push to `main` redeploys automatically; other branches get their own preview link.

## Project layout

```
app/
  layout.tsx            fonts, icon sprite, saved light/dark choice
  globals.css           theme tokens and all styles
  dashboard/page.tsx    learner dashboard
  lessons/[lessonId]/   placeholder: lesson player and quiz come next
  courses/[courseId]/   placeholder: course overview comes next
components/             Sidebar, TopBar, NextLessonHero, StatTiles,
                        LessonSteps, CourseGrid, ResourceList, ...
lib/
  types.ts              data shapes the components render
  demo-data.ts          DEMO CONTENT ONLY, not approved training material
  data.ts               getDashboardData(): swap demo data for Supabase here
supabase/migrations/    database schema and access policies
```

## Supabase

See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md). Without the Supabase env vars the app runs in demo mode (no sign-in, sample data).

## Tests

```bash
npm test
```

Covers the progression rules in `lib/progress.ts`: exact pass ratio, unlocking, retries keeping a pass, course completion.

The service role key is server-only. Never expose it in browser code or commit it.

## Ground rules from the brief

- Eligibility, scoring and unlocking are enforced on the server, never only in the browser.
- Correct answers are never sent to the browser before a quiz is submitted.
- Quiz attempts are append-only; a later failed retry never removes an earlier pass.
- Video tracking is a practical training gate, not proof of attention.
- Demo content stays labelled and separate from approved training.

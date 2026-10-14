# Keapr Training

Private internal training app for Keapr staff: video lessons followed by quizzes, where passing a quiz unlocks the next lesson.

**Status:** sign-in, learner dashboard, course pages, lesson player with watch tracking, server-scored quizzes, and admin (overview, staff, course builder with video upload) are built. Public previews with sample data: `/demo` and `/demo/admin`. See [docs/CHECKLIST.md](docs/CHECKLIST.md).

## Stack

- Next.js 15 (App Router) + TypeScript
- Plain CSS with theme tokens in `app/globals.css` (light by default, dark via the toggle)
- Supabase for sign-in, the database and private file storage
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
  (app)/lessons/[id]    lesson player, watch tracking, quiz
  (app)/courses/[id]    course overview and completion record
  (app)/admin/          overview, staff, course builder
components/             Sidebar, TopBar, NextLessonHero, StatTiles,
                        LessonSteps, CourseGrid, ResourceList, ...
lib/
  types.ts              data shapes the components render
  demo-data.ts          DEMO CONTENT ONLY, not approved training material
  data.ts               dashboard data from Supabase (demo data on /demo)
  progress.ts           progression rules (tested in tests/)
  auth.ts               requireProfile / requireAdmin
supabase/migrations/    database schema and access policies
```

## Supabase

See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md). Without the Supabase env vars the app runs in demo mode (no sign-in, sample data).

## Tests

```bash
npm test
```

Covers progression rules (`lib/progress.ts`), watched-time ranges (`lib/video-ranges.ts`), course draft validation and the admin overview calculations.

The service role key is server-only. Never expose it in browser code or commit it.

## Ground rules from the brief

- Eligibility, scoring and unlocking are enforced on the server, never only in the browser.
- Correct answers are never sent to the browser before a quiz is submitted.
- Quiz attempts are append-only; a later failed retry never removes an earlier pass.
- Video tracking is a practical training gate, not proof of attention.
- Demo content stays labelled and separate from approved training.

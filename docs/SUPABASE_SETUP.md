# Supabase setup

Steps already done: project created (London), `0001_initial_schema.sql` run, public sign-ups off, Site URL and redirect URLs set, four environment variables added in Vercel.

## 1. Run the second migration

SQL Editor → New query → paste `supabase/migrations/0002_profiles_and_demo_flag.sql` → Run.

This creates a profile automatically for every new account, lets the SQL editor promote admins, and adds the demo label to course versions.

## 2. Create your admin account

1. Authentication → Users → **Add user → Create new user**.
2. Enter your work email and a strong password, tick **Auto Confirm User**, and create.
3. SQL Editor → run (with your email and name):

```sql
update public.profiles
set role = 'admin', full_name = 'Kieran Stephenson'
where email = 'you@keapr.co.uk';
```

It should say `1 row affected`.

## 3. Add the demo course

SQL Editor → paste `supabase/seed/demo_course.sql` → Run. It creates one labelled demo course with three lessons and enrols every admin on it.

## 4. Sign in

Open https://keapr-training.vercel.app, sign in with the account from step 2. The dashboard now reads from the database.

The public demo with sample data stays at https://keapr-training.vercel.app/demo.

## 5. Run the third migration (course builder)

SQL Editor → paste `supabase/migrations/0003_publish_course.sql` → Run. This adds the function that publishes a course draft as a new version in one step. Without it, **Publish** in the course builder fails.

## 6. Run the fourth migration (fast staff list)

SQL Editor → paste `supabase/migrations/0004_staff_overview.sql` → Run. The staff page then loads with one query. Without it, the page still works but is slower.

## 7. Run the fifth migration (lessons and quizzes)

SQL Editor → paste `supabase/migrations/0005_lessons_and_quizzes.sql` → Run. Adds the private `lesson-videos` storage bucket and the function that scores quizzes on the server. Without it, video uploads and quiz submissions fail.

## 8. Add the Getting started course

SQL Editor → paste `supabase/seed/getting_started_course.sql` → Run. Creates *Getting started with Keapr Training* (three lessons about how the app works) and assigns it to everyone active. Upload the videos from the course builder, then publish.

## 9. Run the sixth migration (clear or reset progress)

SQL Editor → paste `supabase/migrations/0006_clear_progress.sql` → Run. Enables **Unassign and clear progress** and **Reset progress** on a person's Staff page. Quiz attempts are never deleted; completions are revoked with a reason.

## 10. Run the seventh migration (mark a lesson complete)

SQL Editor → paste `supabase/migrations/0007_admin_complete_lesson.sql` → Run. Enables **Mark complete…** under each course on a person's Staff page. A reason is required; the completion shows as admin-marked and is recorded in the audit history.

## 11. Run the eighth migration (notifications)

SQL Editor → paste `supabase/migrations/0008_notifications.sql` → Run. Turns on the bell in the top bar. People are notified when a course is added, removed or reset, or a lesson is marked complete for them; admins are notified when someone completes a course or reports a problem from the Help page. Until it's run, the bell simply shows nothing.

## 12. Run the ninth migration (watch-only lessons)

SQL Editor → paste `supabase/migrations/0009_watch_only_lessons.sql` → Run. Lets a lesson have no quiz: untick **This lesson has a quiz** in the course builder and the lesson completes once the video has been watched (100% by default; skipping ahead doesn't count).

## 13. Run the tenth migration (archive and delete courses)

SQL Editor → paste `supabase/migrations/0010_course_path_archive_delete.sql` → Run (after 0009). Adds:

- **Archive** a course from the bottom of its builder page: hidden from the list, assigning and search, all history kept, restorable.
- **Delete** a course permanently, only if it has never been assigned to anyone. Its videos are removed too.

## 14. Run the eleventh migration (training paths)

SQL Editor → paste `supabase/migrations/0011_training_paths.sql` → Run (after 0010). Turns on **Admin → Paths**: named, ordered sets of courses (for example one per team). Assign a path to someone, from the path page or their Staff page, and they get its published courses, each locked until the earlier ones are finished. Someone can be on several paths. Courses added to a path later, or published later, are assigned to everyone on it. Locks are checked on the server.

## 15. Run the twelfth migration (lesson downloads)

SQL Editor → paste `supabase/migrations/0012_lesson_downloads.sql` → Run (after 0011). Adds a private `lesson-files` storage bucket and a **Downloads** section to each lesson in the course builder. Uploaded files show as **Download** buttons at the top of the lesson. Download links are made per person, last an hour, and only for lessons they've unlocked.

## 16. Run the thirteenth migration (last active and timings)

SQL Editor → paste `supabase/migrations/0013_activity_and_timings.sql` → Run (after 0012). Records **last active** as people use the app (not just when they type their password), when each quiz attempt was started (so reports show time taken), and when each lesson's video was first opened. Older activity has no timings.

## 17. Run the fourteenth migration (reading lessons)

SQL Editor → paste `supabase/migrations/0014_reading_lessons.sql` → Run (after 0013). Adds a **Lesson type** choice to each lesson in the course builder: **Video** or **Reading (no video)**. A reading lesson shows its text; staff tick **I've read this** to unlock the quiz (or to finish the lesson if it has no quiz). The tick is checked on the server, like the video gate. Set a reading time so the dashboard shows how long it takes.

## Inviting staff

Admin → Staff → **Add someone** creates the account and gives you a one-time link to send them (email, WhatsApp, Slack). No email service is needed. Links expire after the time set in Authentication → Providers → Email → *Email OTP Expiration* (1 hour by default; set it to 86400 for 24 hours).

## Optional: password reset emails

Invites don't use email: **Add someone** gives you a link to send yourself. The only email Supabase sends is from **Forgot password** on the sign-in page. It uses Supabase's built-in sender, which is limited to a few emails an hour and comes from a Supabase address. That's fine for a small team. Test it once; if the link in the email doesn't work, change the Reset password template (Authentication → Emails) to:

```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery
```

If someone is ever stuck, open their Staff page and use **Get a password reset link** instead and send it to them.

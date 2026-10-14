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

## Inviting staff

Admin → Staff → **Add someone** creates the account and gives you a one-time link to send them (email, WhatsApp, Slack). No email service is needed. Links expire after the time set in Authentication → Providers → Email → *Email OTP Expiration* (1 hour by default; set it to 86400 for 24 hours).

## Later: email templates for invitations

Before inviting staff, change the Invite user and Reset password templates (Authentication → Emails) so their links go through the app:

```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=invite
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery
```

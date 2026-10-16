-- Keapr Training: in-app notifications (the bell in the top bar).
-- Written by the server only (service role). Each person can read their own
-- and mark them read; nothing else.

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  kind       text not null,          -- 'welcome', 'course_assigned', 'course_removed', 'progress_reset', 'lesson_marked', 'course_completed', 'problem_report'
  title      text not null,
  body       text,
  link       text,                   -- an in-app path such as /courses/<id>
  created_at timestamptz not null default now(),
  read_at    timestamptz,
  check (link is null or link like '/%')
);

create index if not exists notifications_user_recent on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Read own notifications" on public.notifications;
create policy "Read own notifications" on public.notifications
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "Mark own notifications read" on public.notifications;
create policy "Mark own notifications read" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Signed-in users may only change read_at; inserts and deletes are server-only.
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

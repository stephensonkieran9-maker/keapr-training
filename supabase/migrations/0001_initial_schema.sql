-- Keapr Training: initial schema
-- Separates authored content (courses), published snapshots (course_versions,
-- lessons, quiz_questions) and learner records (enrolments, progress, attempts,
-- completions). Run in the Supabase SQL editor or with `supabase db push`.
-- Development project only: do not run against any Keapr production database.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- People
-- ─────────────────────────────────────────────────────────────

create type public.user_role as enum ('learner', 'admin');

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete restrict,
  full_name   text not null,
  email       text not null unique,
  role        public.user_role not null default 'learner',
  is_active   boolean not null default true,
  theme_mode  text not null default 'light' check (theme_mode in ('light', 'dark')),
  created_at  timestamptz not null default now(),
  deactivated_at timestamptz
);

create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'revoked');

create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  full_name   text not null,
  role        public.user_role not null default 'learner',
  status      public.invitation_status not null default 'pending',
  invited_by  uuid not null references public.profiles (id),
  expires_at  timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);
create unique index invitations_one_pending_per_email
  on public.invitations (lower(email)) where status = 'pending';

-- ─────────────────────────────────────────────────────────────
-- Content: editable courses and immutable published versions
-- ─────────────────────────────────────────────────────────────

create table public.courses (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null default '',
  is_demo     boolean not null default false,   -- demo content is labelled in the UI
  draft       jsonb not null default '{}'::jsonb, -- working copy edited by admins
  created_by  uuid references public.profiles (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create type public.version_status as enum ('published', 'retired');

create table public.course_versions (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses (id) on delete restrict,
  version      integer not null check (version > 0),
  title        text not null,
  description  text not null default '',
  status       public.version_status not null default 'published',
  published_by uuid not null references public.profiles (id),
  published_at timestamptz not null default now(),
  unique (course_id, version)
);

create table public.lessons (
  id                    uuid primary key default gen_random_uuid(),
  course_version_id     uuid not null references public.course_versions (id) on delete restrict,
  position              integer not null check (position > 0),
  title                 text not null,
  objectives            text[] not null default '{}',
  notes                 text,
  video_provider        text not null,          -- e.g. 'supabase-storage', 'mux'
  video_ref             text not null,          -- storage path or provider asset id
  video_seconds         integer not null check (video_seconds > 0),
  captions_ref          text,
  required_watch_ratio  numeric(4,3) not null default 0.900 check (required_watch_ratio > 0 and required_watch_ratio <= 1),
  pass_ratio            numeric(4,3) not null default 0.800 check (pass_ratio > 0 and pass_ratio <= 1),
  is_required           boolean not null default true,
  estimated_minutes     integer,
  unique (course_version_id, position)
);

create table public.lesson_resources (
  id         uuid primary key default gen_random_uuid(),
  lesson_id  uuid not null references public.lessons (id) on delete restrict,
  title      text not null,
  kind       text not null check (kind in ('pdf', 'doc', 'checklist', 'other')),
  storage_path text not null,   -- private bucket; served via signed URLs
  size_bytes bigint
);

-- Questions are versioned with their lesson. The correct answer lives in a
-- separate table that learners can never read.
create table public.quiz_questions (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references public.lessons (id) on delete restrict,
  position    integer not null check (position > 0),
  prompt      text not null check (length(trim(prompt)) > 0),
  explanation text not null default '',
  unique (lesson_id, position)
);

create table public.quiz_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions (id) on delete restrict,
  position    integer not null check (position > 0),
  label       text not null check (length(trim(label)) > 0),
  unique (question_id, position)
);

create table public.quiz_answer_keys (
  question_id       uuid primary key references public.quiz_questions (id) on delete restrict,
  correct_option_id uuid not null references public.quiz_options (id) on delete restrict
);

-- ─────────────────────────────────────────────────────────────
-- Learner records
-- ─────────────────────────────────────────────────────────────

create table public.enrolments (
  id                uuid primary key default gen_random_uuid(),
  learner_id        uuid not null references public.profiles (id) on delete restrict,
  course_version_id uuid not null references public.course_versions (id) on delete restrict,
  assigned_by       uuid not null references public.profiles (id),
  assigned_at       timestamptz not null default now(),
  unassigned_at     timestamptz,
  completed_at      timestamptz,
  unique (learner_id, course_version_id)
);

create table public.video_progress (
  enrolment_id     uuid not null references public.enrolments (id) on delete restrict,
  lesson_id        uuid not null references public.lessons (id) on delete restrict,
  position_seconds numeric(10,2) not null default 0,
  watched_ranges   jsonb not null default '[]'::jsonb, -- merged [[start,end],...] in seconds
  watched_seconds  numeric(10,2) not null default 0,   -- unique seconds, computed on the server
  quiz_unlocked_at timestamptz,
  updated_at       timestamptz not null default now(),
  primary key (enrolment_id, lesson_id)
);

-- Attempts are append-only: never updated or deleted.
create table public.quiz_attempts (
  id               uuid primary key default gen_random_uuid(),
  enrolment_id     uuid not null references public.enrolments (id) on delete restrict,
  lesson_id        uuid not null references public.lessons (id) on delete restrict,
  submitted_answers jsonb not null,      -- { question_id: option_id }
  correct_count    integer not null check (correct_count >= 0),
  question_count   integer not null check (question_count > 0),
  pass_ratio_used  numeric(4,3) not null,
  passed           boolean not null,
  submitted_at     timestamptz not null default now(),
  check (correct_count <= question_count)
);

create type public.completion_source as enum ('quiz_pass', 'admin_override');

create table public.lesson_completions (
  id           uuid primary key default gen_random_uuid(),
  enrolment_id uuid not null references public.enrolments (id) on delete restrict,
  lesson_id    uuid not null references public.lessons (id) on delete restrict,
  source       public.completion_source not null,
  attempt_id   uuid references public.quiz_attempts (id),
  override_reason text,
  completed_by uuid references public.profiles (id),
  completed_at timestamptz not null default now(),
  revoked_at   timestamptz,   -- set only by an explicit admin reset
  revoked_by   uuid references public.profiles (id),
  revoke_reason text,
  check (source <> 'quiz_pass' or attempt_id is not null),
  check (source <> 'admin_override' or (override_reason is not null and completed_by is not null))
);
-- One live completion per enrolment and lesson: repeat submissions and two
-- open tabs can't create duplicates.
create unique index lesson_completions_one_live
  on public.lesson_completions (enrolment_id, lesson_id) where revoked_at is null;

create table public.audit_events (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.profiles (id),
  action      text not null,   -- 'assign', 'unassign', 'publish', 'reset', 'override', 'role_change', 'deactivate', ...
  target_type text not null,
  target_id   uuid,
  reason      text,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Helpers
-- ─────────────────────────────────────────────────────────────

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_active);
$$;

-- Course versions the signed-in learner is actively enrolled on.
create or replace function public.my_course_version_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select e.course_version_id
  from public.enrolments e
  join public.profiles p on p.id = e.learner_id
  where e.learner_id = auth.uid() and e.unassigned_at is null and p.is_active;
$$;

-- Learners can't promote themselves or reactivate their own account.
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role
       or new.is_active is distinct from old.is_active
       or new.email is distinct from old.email then
      raise exception 'Only an administrator can change role, status or email';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ─────────────────────────────────────────────────────────────
-- Row-level security
-- Learners: read their own profile, enrolments and progress, and the
-- content of courses they're enrolled on. All writes to progress, attempts
-- and completions go through server code using the service role, which
-- checks eligibility and scores quizzes. Admins: full read, content edits.
-- ─────────────────────────────────────────────────────────────

alter table public.profiles           enable row level security;
alter table public.invitations        enable row level security;
alter table public.courses            enable row level security;
alter table public.course_versions    enable row level security;
alter table public.lessons            enable row level security;
alter table public.lesson_resources   enable row level security;
alter table public.quiz_questions     enable row level security;
alter table public.quiz_options       enable row level security;
alter table public.quiz_answer_keys   enable row level security;
alter table public.enrolments         enable row level security;
alter table public.video_progress     enable row level security;
alter table public.quiz_attempts      enable row level security;
alter table public.lesson_completions enable row level security;
alter table public.audit_events       enable row level security;

-- Profiles
create policy "read own profile" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "update own preferences" on public.profiles
  for update using (id = auth.uid() and public.is_active_user()) with check (id = auth.uid());
create policy "admins manage profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- Invitations: admins only
create policy "admins manage invitations" on public.invitations
  for all using (public.is_admin()) with check (public.is_admin());

-- Courses (drafts): admins only. Learners read published versions instead.
create policy "admins manage courses" on public.courses
  for all using (public.is_admin()) with check (public.is_admin());

-- Published content: enrolled learners read; admins manage
create policy "learners read enrolled versions" on public.course_versions
  for select using (id in (select public.my_course_version_ids()) or public.is_admin());
create policy "admins manage versions" on public.course_versions
  for all using (public.is_admin()) with check (public.is_admin());

create policy "learners read enrolled lessons" on public.lessons
  for select using (course_version_id in (select public.my_course_version_ids()) or public.is_admin());
create policy "admins manage lessons" on public.lessons
  for all using (public.is_admin()) with check (public.is_admin());

create policy "learners read enrolled resources" on public.lesson_resources
  for select using (
    public.is_admin() or lesson_id in (
      select l.id from public.lessons l where l.course_version_id in (select public.my_course_version_ids())
    ));
create policy "admins manage resources" on public.lesson_resources
  for all using (public.is_admin()) with check (public.is_admin());

create policy "learners read enrolled questions" on public.quiz_questions
  for select using (
    public.is_admin() or lesson_id in (
      select l.id from public.lessons l where l.course_version_id in (select public.my_course_version_ids())
    ));
create policy "admins manage questions" on public.quiz_questions
  for all using (public.is_admin()) with check (public.is_admin());

create policy "learners read enrolled options" on public.quiz_options
  for select using (
    public.is_admin() or question_id in (
      select q.id from public.quiz_questions q
      join public.lessons l on l.id = q.lesson_id
      where l.course_version_id in (select public.my_course_version_ids())
    ));
create policy "admins manage options" on public.quiz_options
  for all using (public.is_admin()) with check (public.is_admin());

-- Answer keys: admins only. Learners never receive correct answers before
-- submitting; the server scores attempts with the service role.
create policy "admins manage answer keys" on public.quiz_answer_keys
  for all using (public.is_admin()) with check (public.is_admin());

-- Learner records: read own, admins read all. No learner insert/update
-- policies, so learners can't write scores or completions directly.
create policy "read own enrolments" on public.enrolments
  for select using (learner_id = auth.uid() or public.is_admin());
create policy "admins manage enrolments" on public.enrolments
  for all using (public.is_admin()) with check (public.is_admin());

create policy "read own video progress" on public.video_progress
  for select using (
    public.is_admin() or enrolment_id in (select id from public.enrolments where learner_id = auth.uid()));

create policy "read own attempts" on public.quiz_attempts
  for select using (
    public.is_admin() or enrolment_id in (select id from public.enrolments where learner_id = auth.uid()));

create policy "read own completions" on public.lesson_completions
  for select using (
    public.is_admin() or enrolment_id in (select id from public.enrolments where learner_id = auth.uid()));

create policy "admins read audit" on public.audit_events
  for select using (public.is_admin());

-- Attempts and audit events are append-only, even for admins.
create or replace function public.block_update_delete()
returns trigger language plpgsql as $$
begin
  raise exception '% rows are append-only', tg_table_name;
end;
$$;

create trigger quiz_attempts_append_only
  before update or delete on public.quiz_attempts
  for each row execute function public.block_update_delete();

create trigger audit_events_append_only
  before update or delete on public.audit_events
  for each row execute function public.block_update_delete();

-- Useful indexes for dashboard and reporting queries
create index enrolments_learner_idx on public.enrolments (learner_id) where unassigned_at is null;
create index lessons_version_idx on public.lessons (course_version_id, position);
create index attempts_enrolment_lesson_idx on public.quiz_attempts (enrolment_id, lesson_id, submitted_at desc);
create index audit_target_idx on public.audit_events (target_type, target_id);

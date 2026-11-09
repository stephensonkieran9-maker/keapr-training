-- Keapr Training: listing-build assessments for job candidates (run after 0017).
--
-- A separate area from staff training. Candidates register through an
-- assessment's shareable link and never get a staff account: they have no
-- row in auth.users or profiles, so they can't reach any training content.
--
-- Every table here has row-level security switched on and NO policies, and
-- the anon/authenticated roles have no grants. Only the server (service role)
-- reads or writes them. That keeps the answer key (assessments.config) and
-- candidates' personal details away from browsers entirely.

create table if not exists public.assessments (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null check (length(trim(title)) > 0),
  slug               text not null unique check (slug ~ '^[a-z0-9-]{6,64}$'),  -- the shareable link: /assess/<slug>
  intro              text not null default '',      -- shown before the candidate starts
  case_study         text not null default '',      -- shown only once the timer is running
  config             jsonb not null default '{}'::jsonb,  -- form fields, weights and the ANSWER KEY (server-only)
  time_limit_minutes integer not null default 60 check (time_limit_minutes between 5 and 240),
  is_open            boolean not null default false,  -- closed: no new registrations or starts
  is_demo            boolean not null default false,
  created_by         uuid references public.profiles (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  archived_at        timestamptz
);

create table if not exists public.assessment_candidates (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  full_name     text not null check (length(trim(full_name)) > 0),
  email         text not null check (position('@' in email) > 1),
  phone         text,
  password_hash text not null,                -- scrypt, hashed by the server
  created_at    timestamptz not null default now()
);
create unique index if not exists assessment_candidates_one_per_email
  on public.assessment_candidates (assessment_id, lower(email));

-- Sign-in sessions for candidates. Only a SHA-256 hash of the cookie value
-- is stored, so a database leak doesn't hand out live sessions.
create table if not exists public.assessment_sessions (
  token_hash   text primary key,
  candidate_id uuid not null references public.assessment_candidates (id) on delete cascade,
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now()
);
create index if not exists assessment_sessions_candidate on public.assessment_sessions (candidate_id);

-- One attempt per candidate. The case study and config are copied in when
-- the timer starts, so later edits never change what an attempt was marked
-- against (unless an admin deliberately re-marks, which is audited).
create table if not exists public.assessment_attempts (
  id                  uuid primary key default gen_random_uuid(),
  candidate_id        uuid not null unique references public.assessment_candidates (id) on delete cascade,
  assessment_id       uuid not null references public.assessments (id) on delete cascade,
  started_at          timestamptz not null default now(),
  deadline_at         timestamptz not null,
  case_study_snapshot text not null,
  config_snapshot     jsonb not null,
  answers             jsonb not null default '{}'::jsonb,
  saved_at            timestamptz,
  submitted_at        timestamptz,
  submit_kind         text check (submit_kind in ('candidate', 'timeout')),
  score               jsonb,          -- per-field breakdown
  accuracy            numeric(6,3),   -- 0 to 100
  time_taken_seconds  integer,
  check (deadline_at > started_at),
  check ((submitted_at is null) = (accuracy is null))
);
create index if not exists assessment_attempts_by_assessment on public.assessment_attempts (assessment_id);

alter table public.assessments           enable row level security;
alter table public.assessment_candidates enable row level security;
alter table public.assessment_sessions   enable row level security;
alter table public.assessment_attempts   enable row level security;

revoke all on public.assessments, public.assessment_candidates,
              public.assessment_sessions, public.assessment_attempts
  from anon, authenticated;
grant all on public.assessments, public.assessment_candidates,
             public.assessment_sessions, public.assessment_attempts
  to service_role;

-- Keapr Training: named training paths (run after 0010).
-- A path is an ordered list of courses, e.g. "Arbitrage team". Assigning a
-- path to someone assigns its published courses, and each course stays
-- locked until the earlier courses in that path (that they're assigned) are
-- finished. Someone can be on several paths. Replaces the single global
-- order from 0010 (courses.path_position), which is converted into a path
-- called "Training path".

create table if not exists public.training_paths (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  created_by  uuid references public.profiles (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.training_path_courses (
  path_id   uuid not null references public.training_paths (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  position  integer not null,
  primary key (path_id, course_id)
);

create table if not exists public.path_assignments (
  id            uuid primary key default gen_random_uuid(),
  path_id       uuid not null references public.training_paths (id) on delete cascade,
  learner_id    uuid not null references public.profiles (id) on delete restrict,
  assigned_by   uuid references public.profiles (id),
  assigned_at   timestamptz not null default now(),
  unassigned_at timestamptz
);
create unique index if not exists path_assignments_one_active
  on public.path_assignments (path_id, learner_id) where unassigned_at is null;

alter table public.training_paths enable row level security;
alter table public.training_path_courses enable row level security;
alter table public.path_assignments enable row level security;

drop policy if exists "admins manage paths" on public.training_paths;
create policy "admins manage paths" on public.training_paths for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage path courses" on public.training_path_courses;
create policy "admins manage path courses" on public.training_path_courses for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage path assignments" on public.path_assignments;
create policy "admins manage path assignments" on public.path_assignments for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "read own path assignments" on public.path_assignments;
create policy "read own path assignments" on public.path_assignments for select using (learner_id = auth.uid());

-- ─── Locks ──────────────────────────────────────────────────────────────

-- Title of the course to finish first, or null if this course is open.
create or replace function public.course_lock_reason(p_learner uuid, p_version uuid)
returns text
language sql stable security definer set search_path = public
as $$
  select v2.title
  from public.course_versions v
  join public.courses c on c.id = v.course_id
  join public.training_path_courses pc on pc.course_id = c.id
  join public.path_assignments pa on pa.path_id = pc.path_id and pa.learner_id = p_learner and pa.unassigned_at is null
  join public.training_path_courses pc2 on pc2.path_id = pc.path_id and pc2.position < pc.position
  join public.courses c2 on c2.id = pc2.course_id and c2.archived_at is null
  join public.course_versions v2 on v2.course_id = c2.id
  join public.enrolments e2 on e2.course_version_id = v2.id and e2.learner_id = p_learner
    and e2.unassigned_at is null and e2.completed_at is null
  where v.id = p_version
    and c.archived_at is null
    -- A course they've already completed stays open.
    and not exists (
      select 1 from public.enrolments mine
      where mine.learner_id = p_learner and mine.course_version_id = p_version
        and mine.unassigned_at is null and mine.completed_at is not null
    )
  order by pc2.position
  limit 1
$$;
revoke all on function public.course_lock_reason(uuid, uuid) from public, anon, authenticated;
grant execute on function public.course_lock_reason(uuid, uuid) to service_role;

-- Order and lock for each of one learner's courses. path_position is the
-- course's earliest position across their paths (for sorting).
create or replace function public.course_locks(p_learner uuid)
returns table (course_version_id uuid, path_position integer, locked_by text)
language plpgsql stable security definer set search_path = public
as $$
begin
  if auth.uid() is not null and auth.uid() <> p_learner and not public.is_admin() then
    raise exception 'NOT_ALLOWED';
  end if;
  return query
    select e.course_version_id,
           (select min(pc.position) from public.training_path_courses pc
              join public.path_assignments pa on pa.path_id = pc.path_id and pa.learner_id = p_learner and pa.unassigned_at is null
              where pc.course_id = v.course_id),
           public.course_lock_reason(p_learner, e.course_version_id)
    from public.enrolments e
    join public.course_versions v on v.id = e.course_version_id
    where e.learner_id = p_learner and e.unassigned_at is null;
end;
$$;
revoke all on function public.course_locks(uuid) from public, anon;
grant execute on function public.course_locks(uuid) to authenticated, service_role;

-- ─── Assigning ──────────────────────────────────────────────────────────

-- Assigns one course to one person, the same way the Staff page does:
-- skips if they already have it, picks up a previous assignment whose
-- progress was kept, otherwise starts the latest published version.
-- Returns 'assigned', 'reassigned', 'already', 'unpublished' or 'archived'.
create or replace function public.assign_course_to(p_learner uuid, p_course uuid, p_actor uuid)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_version uuid;
  v_previous uuid;
begin
  if exists (select 1 from public.courses where id = p_course and archived_at is not null) then
    return 'archived';
  end if;
  if exists (
    select 1 from public.enrolments e join public.course_versions v on v.id = e.course_version_id
    where e.learner_id = p_learner and v.course_id = p_course and e.unassigned_at is null
  ) then
    return 'already';
  end if;

  select id into v_version from public.course_versions
  where course_id = p_course and status = 'published' order by version desc limit 1;
  if v_version is null then
    return 'unpublished';
  end if;

  select id into v_previous from public.enrolments
  where learner_id = p_learner and course_version_id = v_version
    and unassigned_at is not null and progress_cleared_at is null
  order by assigned_at desc limit 1;

  if v_previous is not null then
    update public.enrolments set unassigned_at = null, assigned_by = p_actor, assigned_at = now() where id = v_previous;
    return 'reassigned';
  end if;
  insert into public.enrolments (learner_id, course_version_id, assigned_by) values (p_learner, v_version, p_actor);
  return 'assigned';
end;
$$;
revoke all on function public.assign_course_to(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.assign_course_to(uuid, uuid, uuid) to service_role;

-- Puts someone on a path and assigns its courses. Returns the ids of the
-- courses newly assigned (for notifications).
create or replace function public.assign_path(p_path uuid, p_learner uuid, p_actor uuid)
returns uuid[]
language plpgsql security definer set search_path = public
as $$
declare
  r record;
  v_new uuid[] := '{}';
  v_result text;
begin
  if not exists (select 1 from public.training_paths where id = p_path) then
    raise exception 'PATH_NOT_FOUND';
  end if;
  insert into public.path_assignments (path_id, learner_id, assigned_by)
  values (p_path, p_learner, p_actor)
  on conflict (path_id, learner_id) where unassigned_at is null do nothing;

  for r in select course_id from public.training_path_courses where path_id = p_path order by position loop
    v_result := public.assign_course_to(p_learner, r.course_id, p_actor);
    if v_result in ('assigned', 'reassigned') then
      v_new := v_new || r.course_id;
    end if;
  end loop;

  insert into public.audit_events (actor_id, action, target_type, target_id, details)
  values (p_actor, 'assign_path', 'profile', p_learner, jsonb_build_object('path_id', p_path, 'courses_assigned', to_jsonb(v_new)));
  return v_new;
end;
$$;
revoke all on function public.assign_path(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.assign_path(uuid, uuid, uuid) to service_role;

-- After a path's courses change (or a path course is published), assigns
-- any missing courses to everyone on the path. Returns (learner, course)
-- pairs newly assigned.
create or replace function public.sync_path(p_path uuid, p_actor uuid)
returns table (learner_id uuid, course_id uuid)
language plpgsql security definer set search_path = public
as $$
declare
  m record;
  c record;
  v_result text;
begin
  for m in select pa.learner_id as lid from public.path_assignments pa
           join public.profiles p on p.id = pa.learner_id and p.is_active
           where pa.path_id = p_path and pa.unassigned_at is null loop
    for c in select pc.course_id as cid from public.training_path_courses pc where pc.path_id = p_path order by pc.position loop
      v_result := public.assign_course_to(m.lid, c.cid, p_actor);
      if v_result in ('assigned', 'reassigned') then
        learner_id := m.lid;
        course_id := c.cid;
        return next;
      end if;
    end loop;
  end loop;
end;
$$;
revoke all on function public.sync_path(uuid, uuid) from public, anon, authenticated;
grant execute on function public.sync_path(uuid, uuid) to service_role;

-- ─── Convert the single order from 0010 into a path ────────────────────

do $$
declare
  v_path uuid;
  v_admin uuid;
begin
  if exists (select 1 from public.courses where path_position is not null)
     and not exists (select 1 from public.training_paths) then
    select id into v_admin from public.profiles where role = 'admin' and is_active order by created_at limit 1;
    insert into public.training_paths (name, description, created_by)
    values ('Training path', 'Created from the course order set before named paths.', v_admin)
    returning id into v_path;

    insert into public.training_path_courses (path_id, course_id, position)
    select v_path, id, row_number() over (order by path_position)
    from public.courses where path_position is not null and archived_at is null;

    -- Everyone who has any of those courses joins the path (it doesn't
    -- assign them anything new; the order keeps applying as before).
    insert into public.path_assignments (path_id, learner_id, assigned_by)
    select distinct v_path, e.learner_id, v_admin
    from public.enrolments e
    join public.course_versions v on v.id = e.course_version_id
    join public.training_path_courses pc on pc.course_id = v.course_id and pc.path_id = v_path
    where e.unassigned_at is null;
  end if;
  update public.courses set path_position = null where path_position is not null;
end $$;

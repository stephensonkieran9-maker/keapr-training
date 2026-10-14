-- Keapr Training: profile creation, setup fix, demo flag
-- Run after 0001 in the Supabase SQL editor.

-- 1. Create a learner profile automatically for every new sign-in account.
--    Role is always 'learner'; admins are promoted deliberately.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
    new.email,
    'learner'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profiles for any accounts created before this trigger existed.
insert into public.profiles (id, full_name, email, role)
select u.id, split_part(u.email, '@', 1), u.email, 'learner'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- 2. Let trusted server code and the SQL editor (no signed-in user) change
--    roles, while still stopping learners from promoting themselves.
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role
       or new.is_active is distinct from old.is_active
       or new.email is distinct from old.email then
      raise exception 'Only an administrator can change role, status or email';
    end if;
  end if;
  return new;
end;
$$;

-- 3. Learners can't read the courses table (drafts), so the demo label
--    lives on the published version they can read.
alter table public.course_versions
  add column if not exists is_demo boolean not null default false;

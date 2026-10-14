-- Keapr Training: fast staff list
-- One query for the admin staff page instead of paging through the
-- auth API for every user. Callable only by server code (service role).

create or replace function public.admin_staff_overview()
returns table (
  id uuid,
  full_name text,
  email text,
  role public.user_role,
  is_active boolean,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  assigned_count bigint,
  completed_count bigint
)
language sql stable security definer set search_path = public
as $$
  select
    p.id, p.full_name, p.email, p.role, p.is_active,
    u.last_sign_in_at, u.email_confirmed_at,
    count(e.id) filter (where e.unassigned_at is null) as assigned_count,
    count(e.id) filter (where e.unassigned_at is null and e.completed_at is not null) as completed_count
  from public.profiles p
  left join auth.users u on u.id = p.id
  left join public.enrolments e on e.learner_id = p.id
  group by p.id, u.last_sign_in_at, u.email_confirmed_at
  order by p.full_name;
$$;

revoke all on function public.admin_staff_overview() from public, anon, authenticated;
grant execute on function public.admin_staff_overview() to service_role;

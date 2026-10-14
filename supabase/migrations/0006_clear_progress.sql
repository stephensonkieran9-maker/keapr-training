-- Keapr Training: clearing a learner's progress on a course
-- Lets an admin unassign with progress cleared, or reset a course so the
-- learner starts again. Quiz attempts are never deleted (they stay in the
-- history, attached to the old assignment); completions are revoked with a
-- reason and video progress is removed.

alter table public.enrolments
  add column if not exists progress_cleared_at timestamptz;

-- Allow a fresh assignment after a cleared one: only one *active*
-- assignment per learner and course version.
alter table public.enrolments
  drop constraint if exists enrolments_learner_id_course_version_id_key;
create unique index if not exists enrolments_one_active
  on public.enrolments (learner_id, course_version_id)
  where unassigned_at is null;

create or replace function public.clear_enrolment_progress(p_enrolment uuid, p_actor uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_learner uuid;
begin
  select learner_id into v_learner from public.enrolments where id = p_enrolment for update;
  if not found then
    raise exception 'ENROLMENT_NOT_FOUND';
  end if;

  update public.lesson_completions
  set revoked_at = now(),
      revoked_by = p_actor,
      revoke_reason = coalesce(nullif(trim(p_reason), ''), 'Progress cleared by an administrator')
  where enrolment_id = p_enrolment and revoked_at is null;

  delete from public.video_progress where enrolment_id = p_enrolment;

  update public.enrolments
  set progress_cleared_at = now(),
      completed_at = null,
      unassigned_at = coalesce(unassigned_at, now())
  where id = p_enrolment;

  insert into public.audit_events (actor_id, action, target_type, target_id, reason, details)
  values (p_actor, 'clear_progress', 'enrolment', p_enrolment, nullif(trim(p_reason), ''), jsonb_build_object('learner_id', v_learner));
end;
$$;

revoke all on function public.clear_enrolment_progress(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.clear_enrolment_progress(uuid, uuid, text) to service_role;

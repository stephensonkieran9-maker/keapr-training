-- Keapr Training: an admin marks a lesson complete for someone (for example,
-- they were trained in person, or a video fault stopped them). Recorded as an
-- 'admin_override' completion with the admin and a required reason, plus an
-- audit event. Completes the course if it was the last required lesson.

create or replace function public.admin_complete_lesson(p_enrolment uuid, p_lesson uuid, p_actor uuid, p_reason text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_enrolment public.enrolments%rowtype;
  v_reason    text := nullif(trim(p_reason), '');
  v_inserted  int;
  v_remaining int;
  v_completed_at timestamptz;
begin
  if v_reason is null then
    raise exception 'REASON_REQUIRED';
  end if;

  select * into v_enrolment from public.enrolments where id = p_enrolment for update;
  if not found or v_enrolment.unassigned_at is not null then
    raise exception 'NOT_ENROLLED';
  end if;
  if not exists (select 1 from public.lessons where id = p_lesson and course_version_id = v_enrolment.course_version_id) then
    raise exception 'LESSON_NOT_FOUND';
  end if;

  insert into public.lesson_completions (enrolment_id, lesson_id, source, override_reason, completed_by)
  values (p_enrolment, p_lesson, 'admin_override', left(v_reason, 500), p_actor)
  on conflict (enrolment_id, lesson_id) where revoked_at is null do nothing;
  get diagnostics v_inserted = row_count;

  select count(*) into v_remaining
  from public.lessons l
  where l.course_version_id = v_enrolment.course_version_id
    and l.is_required
    and not exists (
      select 1 from public.lesson_completions c
      where c.enrolment_id = p_enrolment and c.lesson_id = l.id and c.revoked_at is null
    );
  v_completed_at := v_enrolment.completed_at;
  if v_remaining = 0 and v_completed_at is null then
    update public.enrolments set completed_at = now() where id = p_enrolment
    returning completed_at into v_completed_at;
  end if;

  if v_inserted > 0 then
    insert into public.audit_events (actor_id, action, target_type, target_id, reason, details)
    values (p_actor, 'override', 'enrolment', p_enrolment, left(v_reason, 500),
            jsonb_build_object('lesson_id', p_lesson, 'learner_id', v_enrolment.learner_id));
  end if;

  return jsonb_build_object('already_complete', v_inserted = 0, 'course_completed', v_completed_at is not null);
end;
$$;

revoke all on function public.admin_complete_lesson(uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.admin_complete_lesson(uuid, uuid, uuid, text) to service_role;

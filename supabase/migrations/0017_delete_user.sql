-- Keapr Training: deleting a person completely (run after 0016).
-- Removes someone and everything that's only about them: assignments,
-- progress, quiz attempts, completions, checklist ticks, path assignments,
-- notifications and invitations. Their profile goes, so they no longer show
-- on Staff. The server then deletes their sign-in account.
--
-- Things other people rely on are kept. Courses they created, versions
-- they published and assignments they made for others are moved to the
-- admin doing the delete (or left blank where that's allowed). The audit
-- log keeps its entries, with the deleted person shown as removed, and a
-- 'delete_user' entry records who was deleted and by whom.
--
-- Quiz attempts and the audit log are normally append-only. This function
-- is the one place allowed to change them, via a setting that only lasts
-- for its own transaction.

create or replace function public.block_update_delete()
returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('keapr.deleting_user', true), '') = 'on' then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  raise exception '% rows are append-only', tg_table_name;
end;
$$;

create or replace function public.delete_user_completely(p_user uuid, p_actor uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_person public.profiles%rowtype;
  v_enrolments uuid[];
begin
  if p_user = p_actor then raise exception 'CANNOT_DELETE_SELF'; end if;

  select * into v_person from public.profiles where id = p_user for update;
  if not found then raise exception 'USER_NOT_FOUND'; end if;

  if v_person.role = 'admin' and not exists (
    select 1 from public.profiles where role = 'admin' and is_active and id <> p_user
  ) then
    raise exception 'LAST_ADMIN';
  end if;

  perform set_config('keapr.deleting_user', 'on', true);

  select coalesce(array_agg(id), '{}') into v_enrolments from public.enrolments where learner_id = p_user;

  -- Their own training records.
  delete from public.lesson_completions where enrolment_id = any (v_enrolments);
  delete from public.quiz_attempts where enrolment_id = any (v_enrolments);
  delete from public.video_progress where enrolment_id = any (v_enrolments);
  if to_regclass('public.checklist_ticks') is not null then
    execute 'delete from public.checklist_ticks where enrolment_id = any ($1)' using v_enrolments;
  end if;
  delete from public.enrolments where id = any (v_enrolments);
  delete from public.path_assignments where learner_id = p_user;
  delete from public.invitations where lower(email) = lower(v_person.email);

  -- Things they did for other people: keep, credited to the deleting admin
  -- or left blank.
  update public.enrolments set assigned_by = p_actor where assigned_by = p_user;
  update public.course_versions set published_by = p_actor where published_by = p_user;
  update public.invitations set invited_by = p_actor where invited_by = p_user;
  update public.courses set created_by = null where created_by = p_user;
  update public.training_paths set created_by = null where created_by = p_user;
  update public.path_assignments set assigned_by = null where assigned_by = p_user;
  update public.lesson_completions set completed_by = null where completed_by = p_user;
  update public.lesson_completions set revoked_by = null where revoked_by = p_user;
  update public.audit_events set actor_id = null where actor_id = p_user;

  -- Notifications go with the profile (on delete cascade).
  delete from public.profiles where id = p_user;

  insert into public.audit_events (actor_id, action, target_type, target_id, details)
  values (p_actor, 'delete_user', 'profile', p_user,
          jsonb_build_object('email', v_person.email, 'full_name', v_person.full_name, 'role', v_person.role,
                             'assignments_removed', coalesce(array_length(v_enrolments, 1), 0)));

  perform set_config('keapr.deleting_user', '', true);

  return jsonb_build_object('email', v_person.email, 'full_name', v_person.full_name);
end;
$$;

revoke all on function public.delete_user_completely(uuid, uuid) from public, anon, authenticated;
grant execute on function public.delete_user_completely(uuid, uuid) to service_role;

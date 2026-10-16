-- Keapr Training: archiving, deleting and ordering courses.
-- Run after 0009.
--
-- Archive: hides a course from the builder list, assigning and search. All
-- learner history is kept. Delete: permanent, and only allowed for a course
-- that has never been assigned to anyone, so no training record can be lost.

alter table public.courses add column if not exists archived_at timestamptz;

create or replace function public.admin_delete_course(p_course uuid, p_actor uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_title text;
begin
  select title into v_title from public.courses where id = p_course for update;
  if not found then
    raise exception 'COURSE_NOT_FOUND';
  end if;

  if exists (
    select 1 from public.enrolments e
    join public.course_versions v on v.id = e.course_version_id
    where v.course_id = p_course
  ) then
    raise exception 'HAS_HISTORY';
  end if;

  delete from public.quiz_answer_keys k using public.quiz_questions q, public.lessons l, public.course_versions v
    where k.question_id = q.id and q.lesson_id = l.id and l.course_version_id = v.id and v.course_id = p_course;
  delete from public.quiz_options o using public.quiz_questions q, public.lessons l, public.course_versions v
    where o.question_id = q.id and q.lesson_id = l.id and l.course_version_id = v.id and v.course_id = p_course;
  delete from public.quiz_questions q using public.lessons l, public.course_versions v
    where q.lesson_id = l.id and l.course_version_id = v.id and v.course_id = p_course;
  delete from public.lesson_resources r using public.lessons l, public.course_versions v
    where r.lesson_id = l.id and l.course_version_id = v.id and v.course_id = p_course;
  delete from public.lessons l using public.course_versions v
    where l.course_version_id = v.id and v.course_id = p_course;
  delete from public.course_versions where course_id = p_course;
  delete from public.courses where id = p_course;

  insert into public.audit_events (actor_id, action, target_type, target_id, details)
  values (p_actor, 'delete_course', 'course', p_course, jsonb_build_object('title', v_title));
end;
$$;

revoke all on function public.admin_delete_course(uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_delete_course(uuid, uuid) to service_role;

-- ─── Training path: courses that open in order ─────────────────────────────
-- A course with a path_position stays locked for a learner until every
-- earlier path course they're assigned to (and that isn't archived) is
-- complete. Courses without a position aren't part of the path.

alter table public.courses add column if not exists path_position integer;

-- Title of the course that has to be finished first, or null if open.
create or replace function public.course_lock_reason(p_learner uuid, p_version uuid)
returns text
language sql stable security definer set search_path = public
as $$
  select v2.title
  from public.course_versions v
  join public.courses c on c.id = v.course_id
  join public.enrolments e2 on e2.learner_id = p_learner and e2.unassigned_at is null and e2.completed_at is null
  join public.course_versions v2 on v2.id = e2.course_version_id
  join public.courses c2 on c2.id = v2.course_id
  where v.id = p_version
    and c.path_position is not null and c.archived_at is null
    and c2.path_position is not null and c2.archived_at is null
    and c2.path_position < c.path_position
    -- A course they've already completed stays open.
    and not exists (
      select 1 from public.enrolments mine
      where mine.learner_id = p_learner and mine.course_version_id = p_version
        and mine.unassigned_at is null and mine.completed_at is not null
    )
  order by c2.path_position
  limit 1
$$;
revoke all on function public.course_lock_reason(uuid, uuid) from public, anon, authenticated;
grant execute on function public.course_lock_reason(uuid, uuid) to service_role;

-- Path position and lock for each of one learner's courses. Learners may
-- only ask about themselves.
drop function if exists public.course_locks(uuid);
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
           case when c.archived_at is null then c.path_position end,
           public.course_lock_reason(p_learner, e.course_version_id)
    from public.enrolments e
    join public.course_versions v on v.id = e.course_version_id
    join public.courses c on c.id = v.course_id
    where e.learner_id = p_learner and e.unassigned_at is null;
end;
$$;
revoke all on function public.course_locks(uuid) from public, anon;
grant execute on function public.course_locks(uuid) to authenticated, service_role;

-- Quiz submissions and watch-only completions refuse locked courses.

create or replace function public.submit_quiz_attempt(
  p_learner uuid,
  p_lesson uuid,
  p_answers jsonb  -- { "<question_id>": "<option_id>", ... }
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_lesson       public.lessons%rowtype;
  v_enrolment    public.enrolments%rowtype;
  v_progress     public.video_progress%rowtype;
  v_total        integer;
  v_answered     integer;
  v_correct      integer;
  v_passed       boolean;
  v_attempt      uuid;
  v_blocking     integer;
  v_remaining    integer;
  v_next         uuid;
  v_completed_at timestamptz;
  v_results      jsonb;
begin
  select * into v_lesson from public.lessons where id = p_lesson;
  if not found then
    raise exception 'LESSON_NOT_FOUND';
  end if;

  -- Lock the enrolment row so two tabs can't double-record.
  select e.* into v_enrolment
  from public.enrolments e
  join public.profiles p on p.id = e.learner_id and p.is_active
  where e.learner_id = p_learner
    and e.course_version_id = v_lesson.course_version_id
    and e.unassigned_at is null
  for update of e;
  if not found then
    raise exception 'NOT_ENROLLED';
  end if;

  -- Courses in the training path open in order.
  if public.course_lock_reason(p_learner, v_lesson.course_version_id) is not null then
    raise exception 'COURSE_LOCKED';
  end if;

  -- Every earlier required lesson must already be passed.
  select count(*) into v_blocking
  from public.lessons l
  where l.course_version_id = v_lesson.course_version_id
    and l.position < v_lesson.position
    and l.is_required
    and not exists (
      select 1 from public.lesson_completions c
      where c.enrolment_id = v_enrolment.id and c.lesson_id = l.id and c.revoked_at is null
    );
  if v_blocking > 0 then
    raise exception 'LESSON_LOCKED';
  end if;

  -- The video threshold must have been reached (or the lesson already passed).
  select * into v_progress from public.video_progress
  where enrolment_id = v_enrolment.id and lesson_id = p_lesson;
  if (v_progress.quiz_unlocked_at is null)
     and not exists (select 1 from public.lesson_completions c
                     where c.enrolment_id = v_enrolment.id and c.lesson_id = p_lesson and c.revoked_at is null) then
    raise exception 'QUIZ_LOCKED';
  end if;

  -- Every question must have exactly one valid answer.
  select count(*) into v_total from public.quiz_questions where lesson_id = p_lesson;
  if v_total = 0 then
    raise exception 'NO_QUESTIONS';
  end if;

  select count(*) into v_answered
  from public.quiz_questions q
  join public.quiz_options o on o.question_id = q.id
  where q.lesson_id = p_lesson
    and o.id::text = p_answers ->> q.id::text;
  if v_answered <> v_total then
    raise exception 'INCOMPLETE_ANSWERS';
  end if;

  select count(*) into v_correct
  from public.quiz_questions q
  join public.quiz_answer_keys k on k.question_id = q.id
  where q.lesson_id = p_lesson
    and k.correct_option_id::text = p_answers ->> q.id::text;

  -- Exact ratio, never a rounded percentage.
  v_passed := v_correct * 1000 >= round(v_lesson.pass_ratio * 1000) * v_total;

  insert into public.quiz_attempts (enrolment_id, lesson_id, submitted_answers, correct_count, question_count, pass_ratio_used, passed)
  values (v_enrolment.id, p_lesson, p_answers, v_correct, v_total, v_lesson.pass_ratio, v_passed)
  returning id into v_attempt;

  if v_passed then
    insert into public.lesson_completions (enrolment_id, lesson_id, source, attempt_id)
    values (v_enrolment.id, p_lesson, 'quiz_pass', v_attempt)
    on conflict (enrolment_id, lesson_id) where revoked_at is null do nothing;
  end if;

  -- Course completion: every required lesson passed.
  select count(*) into v_remaining
  from public.lessons l
  where l.course_version_id = v_lesson.course_version_id
    and l.is_required
    and not exists (
      select 1 from public.lesson_completions c
      where c.enrolment_id = v_enrolment.id and c.lesson_id = l.id and c.revoked_at is null
    );
  v_completed_at := v_enrolment.completed_at;
  if v_remaining = 0 and v_completed_at is null then
    update public.enrolments set completed_at = now() where id = v_enrolment.id
    returning completed_at into v_completed_at;
  end if;

  select id into v_next from public.lessons
  where course_version_id = v_lesson.course_version_id and position > v_lesson.position
  order by position limit 1;

  -- Per-question feedback. The correct option is only revealed on a pass.
  select coalesce(jsonb_agg(jsonb_build_object(
      'question_id', q.id,
      'selected_option_id', p_answers ->> q.id::text,
      'is_correct', k.correct_option_id::text = p_answers ->> q.id::text,
      'correct_option_id', case when v_passed then k.correct_option_id end,
      'explanation', q.explanation
    ) order by q.position), '[]'::jsonb)
  into v_results
  from public.quiz_questions q
  join public.quiz_answer_keys k on k.question_id = q.id
  where q.lesson_id = p_lesson;

  return jsonb_build_object(
    'attempt_id', v_attempt,
    'passed', v_passed,
    'correct', v_correct,
    'total', v_total,
    'pass_ratio', v_lesson.pass_ratio,
    'next_lesson_id', v_next,
    'course_completed', v_completed_at is not null,
    'course_completed_at', v_completed_at,
    'results', v_results
  );
end;
$$;

revoke all on function public.submit_quiz_attempt(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.submit_quiz_attempt(uuid, uuid, jsonb) to service_role;

create or replace function public.complete_watched_lesson(p_learner uuid, p_lesson uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_lesson     public.lessons%rowtype;
  v_enrolment  public.enrolments%rowtype;
  v_inserted   int;
  v_remaining  int;
  v_completed_at timestamptz;
  v_next       uuid;
begin
  select * into v_lesson from public.lessons where id = p_lesson;
  if not found then raise exception 'LESSON_NOT_FOUND'; end if;

  select * into v_enrolment from public.enrolments
  where learner_id = p_learner and course_version_id = v_lesson.course_version_id and unassigned_at is null
  for update;
  if not found then raise exception 'NOT_ENROLLED'; end if;

  if public.course_lock_reason(p_learner, v_lesson.course_version_id) is not null then
    raise exception 'COURSE_LOCKED';
  end if;

  if exists (select 1 from public.quiz_questions where lesson_id = p_lesson) then
    raise exception 'HAS_QUIZ';
  end if;

  if exists (
    select 1 from public.lessons l
    where l.course_version_id = v_lesson.course_version_id and l.is_required and l.position < v_lesson.position
      and not exists (select 1 from public.lesson_completions c where c.enrolment_id = v_enrolment.id and c.lesson_id = l.id and c.revoked_at is null)
  ) then
    raise exception 'LESSON_LOCKED';
  end if;

  if not exists (
    select 1 from public.video_progress
    where enrolment_id = v_enrolment.id and lesson_id = p_lesson and quiz_unlocked_at is not null
  ) then
    raise exception 'NOT_WATCHED';
  end if;

  insert into public.lesson_completions (enrolment_id, lesson_id, source)
  values (v_enrolment.id, p_lesson, 'watched')
  on conflict (enrolment_id, lesson_id) where revoked_at is null do nothing;
  get diagnostics v_inserted = row_count;

  select count(*) into v_remaining
  from public.lessons l
  where l.course_version_id = v_lesson.course_version_id and l.is_required
    and not exists (select 1 from public.lesson_completions c where c.enrolment_id = v_enrolment.id and c.lesson_id = l.id and c.revoked_at is null);
  v_completed_at := v_enrolment.completed_at;
  if v_remaining = 0 and v_completed_at is null then
    update public.enrolments set completed_at = now() where id = v_enrolment.id
    returning completed_at into v_completed_at;
  end if;

  select id into v_next from public.lessons
  where course_version_id = v_lesson.course_version_id and position > v_lesson.position
  order by position limit 1;

  return jsonb_build_object(
    'newly_completed', v_inserted > 0,
    'next_lesson_id', v_next,
    'course_completed', v_completed_at is not null,
    'course_completed_at', v_completed_at
  );
end;
$$;

revoke all on function public.complete_watched_lesson(uuid, uuid) from public, anon, authenticated;
grant execute on function public.complete_watched_lesson(uuid, uuid) to service_role;

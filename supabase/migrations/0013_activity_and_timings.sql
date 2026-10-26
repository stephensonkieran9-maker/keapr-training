-- Keapr Training: last active, and timings for reporting (run after 0012).
-- 1. profiles.last_seen_at: updated (at most every 5 minutes) while someone
--    uses the app, so "last active" is right even if they stay signed in.
-- 2. quiz_attempts.started_at: when each attempt was started, so reports can
--    show how long it took. Older attempts have no start time.
-- 3. video_progress.created_at: when they first started a lesson's video.

alter table public.profiles add column if not exists last_seen_at timestamptz;

create or replace function public.touch_last_seen()
returns void
language sql security definer set search_path = public
as $$
  update public.profiles set last_seen_at = now()
  where id = auth.uid() and (last_seen_at is null or last_seen_at < now() - interval '2 minutes');
$$;
revoke all on function public.touch_last_seen() from public, anon;
grant execute on function public.touch_last_seen() to authenticated;

alter table public.quiz_attempts add column if not exists started_at timestamptz;

-- Existing rows stay null: we don't know when those lessons were started.
alter table public.video_progress add column if not exists created_at timestamptz;
alter table public.video_progress alter column created_at set default now();

-- Quiz submission with a start time. The three-argument version stays and
-- passes no start time, so nothing breaks while the app updates.
create or replace function public.submit_quiz_attempt(
  p_learner uuid,
  p_lesson uuid,
  p_answers jsonb,  -- { "<question_id>": "<option_id>", ... }
  p_started_at timestamptz  -- when the learner started this attempt (from the browser)
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

  insert into public.quiz_attempts (enrolment_id, lesson_id, submitted_answers, correct_count, question_count, pass_ratio_used, passed, started_at)
  values (v_enrolment.id, p_lesson, p_answers, v_correct, v_total, v_lesson.pass_ratio, v_passed,
          -- Only keep a believable start time: in the past, and within 6 hours.
          case when p_started_at <= now() and p_started_at > now() - interval '6 hours' then p_started_at end)
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

revoke all on function public.submit_quiz_attempt(uuid, uuid, jsonb, timestamptz) from public, anon, authenticated;
grant execute on function public.submit_quiz_attempt(uuid, uuid, jsonb, timestamptz) to service_role;

create or replace function public.submit_quiz_attempt(p_learner uuid, p_lesson uuid, p_answers jsonb)
returns jsonb
language sql security definer set search_path = public
as $$
  select public.submit_quiz_attempt(p_learner, p_lesson, p_answers, null::timestamptz);
$$;
revoke all on function public.submit_quiz_attempt(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.submit_quiz_attempt(uuid, uuid, jsonb) to service_role;

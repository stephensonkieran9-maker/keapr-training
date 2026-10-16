-- Keapr Training: watch-only lessons (no quiz).
-- A lesson published with no quiz questions completes once the learner has
-- watched the required share of the video (checked on the server from their
-- saved watch ranges). Recorded as a 'watched' completion.

alter type public.completion_source add value if not exists 'watched';

-- Publishing: allow lessons with no questions when the draft says so.
create or replace function public.publish_course(p_course_id uuid, p_actor uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  c          public.courses%rowtype;
  d          jsonb;
  v_version  integer;
  v_id       uuid;
  les        jsonb;
  q          jsonb;
  opt        jsonb;
  v_lesson   uuid;
  v_q        uuid;
  v_opt      uuid;
  v_correct  uuid;
  li         integer := 0;
  qi         integer;
  oi         integer;
begin
  select * into c from public.courses where id = p_course_id for update;
  if not found then
    raise exception 'Course not found';
  end if;

  d := coalesce(c.draft, '{}'::jsonb);
  if jsonb_array_length(coalesce(d->'lessons', '[]'::jsonb)) = 0 then
    raise exception 'Add at least one lesson before publishing';
  end if;

  select coalesce(max(version), 0) + 1 into v_version
  from public.course_versions where course_id = p_course_id;

  -- Older versions stay readable for learners already on them.
  update public.course_versions set status = 'retired'
  where course_id = p_course_id and status = 'published';

  insert into public.course_versions (course_id, version, title, description, published_by, is_demo)
  values (p_course_id, v_version, c.title, c.description, p_actor, c.is_demo)
  returning id into v_id;

  for les in select value from jsonb_array_elements(d->'lessons') loop
    li := li + 1;
    if coalesce(trim(les->>'title'), '') = '' then
      raise exception 'Lesson % needs a title', li;
    end if;

    insert into public.lessons (
      course_version_id, position, title, objectives, notes,
      video_provider, video_ref, video_seconds,
      required_watch_ratio, pass_ratio, is_required, estimated_minutes
    ) values (
      v_id, li, trim(les->>'title'),
      coalesce(array(select jsonb_array_elements_text(coalesce(les->'objectives', '[]'::jsonb))), '{}'),
      nullif(trim(coalesce(les->>'notes', '')), ''),
      'url',
      coalesce(trim(les->>'videoRef'), ''),
      (les->>'videoSeconds')::integer,
      (les->>'requiredWatchPercent')::numeric / 100,
      (les->>'passPercent')::numeric / 100,
      coalesce((les->>'isRequired')::boolean, true),
      nullif(les->>'estimatedMinutes', '')::integer
    )
    returning id into v_lesson;

    qi := 0;
    -- Watch-only lessons ("hasQuiz": false) publish without questions.
    for q in select value from jsonb_array_elements(
      case when coalesce((les->>'hasQuiz')::boolean, true) then coalesce(les->'questions', '[]'::jsonb) else '[]'::jsonb end
    ) loop
      qi := qi + 1;
      insert into public.quiz_questions (lesson_id, position, prompt, explanation)
      values (v_lesson, qi, trim(q->>'prompt'), coalesce(trim(q->>'explanation'), ''))
      returning id into v_q;

      oi := 0;
      v_correct := null;
      for opt in select value from jsonb_array_elements(coalesce(q->'options', '[]'::jsonb)) loop
        oi := oi + 1;
        insert into public.quiz_options (question_id, position, label)
        values (v_q, oi, trim(opt #>> '{}'))
        returning id into v_opt;
        if oi - 1 = (q->>'correctIndex')::integer then
          v_correct := v_opt;
        end if;
      end loop;

      if oi < 2 then
        raise exception 'Lesson %, question % needs at least two options', li, qi;
      end if;
      if v_correct is null then
        raise exception 'Lesson %, question % needs a correct answer', li, qi;
      end if;

      insert into public.quiz_answer_keys (question_id, correct_option_id) values (v_q, v_correct);
    end loop;

    if qi = 0 and coalesce((les->>'hasQuiz')::boolean, true) then
      raise exception 'Lesson % needs at least one quiz question', li;
    end if;
  end loop;

  update public.courses set updated_at = now() where id = p_course_id;

  insert into public.audit_events (actor_id, action, target_type, target_id, details)
  values (p_actor, 'publish', 'course', p_course_id, jsonb_build_object('version', v_version, 'course_version_id', v_id));

  return v_id;
end;
$$;

revoke all on function public.publish_course(uuid, uuid) from public, anon, authenticated;
grant execute on function public.publish_course(uuid, uuid) to service_role;

-- Completes a watch-only lesson. Called by the server after it has saved the
-- learner's watch progress; re-checks everything itself.
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

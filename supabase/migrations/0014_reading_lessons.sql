-- Keapr Training: reading lessons (run after 0013).
-- A lesson can now be "reading" instead of "video": the learner reads the
-- lesson text (and any downloads), confirms they've read it, and that unlocks
-- the quiz. A reading lesson with no quiz completes when they confirm.
--
-- Reading lessons reuse the existing gate: confirming sets
-- video_progress.quiz_unlocked_at, which submit_quiz_attempt and
-- complete_watched_lesson already check. video_seconds holds the reading
-- time so durations and progress bars keep working.

alter table public.lessons add column if not exists kind text not null default 'video';
alter table public.lessons drop constraint if exists lessons_kind_check;
alter table public.lessons add constraint lessons_kind_check check (kind in ('video', 'reading'));
alter table public.lessons add column if not exists reading_body text;

-- Publishing: copies the lesson kind and reading text.
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
  v_kind     text;
  v_seconds  integer;
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

    v_kind := case when les->>'kind' = 'reading' then 'reading' else 'video' end;
    if v_kind = 'reading' then
      if coalesce(trim(les->>'readingBody'), '') = '' then
        raise exception 'Lesson % needs the reading text', li;
      end if;
      -- Reading time stands in for the video length.
      v_seconds := greatest(1, coalesce(nullif(les->>'estimatedMinutes', '')::integer, 5)) * 60;
    else
      v_seconds := (les->>'videoSeconds')::integer;
    end if;

    insert into public.lessons (
      course_version_id, position, title, objectives, notes,
      video_provider, video_ref, video_seconds,
      required_watch_ratio, pass_ratio, is_required, estimated_minutes,
      kind, reading_body
    ) values (
      v_id, li, trim(les->>'title'),
      coalesce(array(select jsonb_array_elements_text(coalesce(les->'objectives', '[]'::jsonb))), '{}'),
      nullif(trim(coalesce(les->>'notes', '')), ''),
      'url',
      case when v_kind = 'reading' then '' else coalesce(trim(les->>'videoRef'), '') end,
      v_seconds,
      case when v_kind = 'reading' then 1 else (les->>'requiredWatchPercent')::numeric / 100 end,
      (les->>'passPercent')::numeric / 100,
      coalesce((les->>'isRequired')::boolean, true),
      nullif(les->>'estimatedMinutes', '')::integer,
      v_kind,
      case when v_kind = 'reading' then trim(les->>'readingBody') end
    )
    returning id into v_lesson;

    -- Downloads attached to the lesson (files in the private lesson-files bucket).
    insert into public.lesson_resources (lesson_id, title, kind, storage_path, size_bytes)
    select v_lesson,
           coalesce(nullif(trim(f->>'title'), ''), 'Download'),
           case when f->>'kind' in ('pdf', 'doc', 'checklist', 'other') then f->>'kind' else 'other' end,
           f->>'ref',
           nullif(f->>'sizeBytes', '')::bigint
    from jsonb_array_elements(coalesce(les->'downloads', '[]'::jsonb)) f
    where coalesce(f->>'ref', '') <> '';

    qi := 0;
    -- Lessons without a quiz ("hasQuiz": false) publish without questions.
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

-- The learner confirms they've read a reading lesson. Re-checks enrolment and
-- locks, then unlocks the quiz (or lets a no-quiz lesson complete) by setting
-- quiz_unlocked_at. Safe to call twice.
create or replace function public.confirm_reading(p_learner uuid, p_lesson uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_lesson     public.lessons%rowtype;
  v_enrolment  public.enrolments%rowtype;
begin
  select * into v_lesson from public.lessons where id = p_lesson;
  if not found then raise exception 'LESSON_NOT_FOUND'; end if;
  if v_lesson.kind <> 'reading' then raise exception 'NOT_READING'; end if;

  select e.* into v_enrolment
  from public.enrolments e
  join public.profiles p on p.id = e.learner_id and p.is_active
  where e.learner_id = p_learner and e.course_version_id = v_lesson.course_version_id and e.unassigned_at is null;
  if not found then raise exception 'NOT_ENROLLED'; end if;

  if public.course_lock_reason(p_learner, v_lesson.course_version_id) is not null then
    raise exception 'COURSE_LOCKED';
  end if;

  if exists (
    select 1 from public.lessons l
    where l.course_version_id = v_lesson.course_version_id and l.is_required and l.position < v_lesson.position
      and not exists (select 1 from public.lesson_completions c where c.enrolment_id = v_enrolment.id and c.lesson_id = l.id and c.revoked_at is null)
  ) then
    raise exception 'LESSON_LOCKED';
  end if;

  insert into public.video_progress (enrolment_id, lesson_id, position_seconds, watched_ranges, watched_seconds, quiz_unlocked_at, updated_at)
  values (v_enrolment.id, p_lesson, 0, jsonb_build_array(jsonb_build_array(0, v_lesson.video_seconds)), v_lesson.video_seconds, now(), now())
  on conflict (enrolment_id, lesson_id) do update
    set quiz_unlocked_at = coalesce(public.video_progress.quiz_unlocked_at, excluded.quiz_unlocked_at),
        watched_seconds  = excluded.watched_seconds,
        watched_ranges   = excluded.watched_ranges,
        updated_at       = now();
end;
$$;

revoke all on function public.confirm_reading(uuid, uuid) from public, anon, authenticated;
grant execute on function public.confirm_reading(uuid, uuid) to service_role;

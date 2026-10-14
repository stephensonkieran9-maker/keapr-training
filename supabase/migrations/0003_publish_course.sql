-- Keapr Training: publishing courses
-- Turns a course's draft (courses.draft JSON, edited in the admin course
-- builder) into an immutable published version in one transaction.
-- Callable only by server code using the service role.

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
    for q in select value from jsonb_array_elements(coalesce(les->'questions', '[]'::jsonb)) loop
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

    if qi = 0 then
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

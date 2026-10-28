-- Keapr Training: task lessons (run after 0015).
-- A reading lesson can be a task: instead of "I've read this", the learner
-- ticks "I've done this" once they've done what the lesson describes
-- (script reps out loud, recordings, roleplays). It works exactly like
-- "I've read this": it's checked on the server, completes the lesson (or
-- unlocks its quiz) and opens the next one. Admins see when it was done.

alter table public.lessons add column if not exists is_task boolean not null default false;

-- The checklist tables from 0015, repeated here (safe to run twice) so this
-- migration works even if 0015 was skipped.
create table if not exists public.course_checklist_items (
  id                uuid primary key default gen_random_uuid(),
  course_version_id uuid not null references public.course_versions (id) on delete cascade,
  position          integer not null check (position > 0),
  section           text not null default '',
  label             text not null check (length(trim(label)) > 0),
  lesson_id         uuid references public.lessons (id) on delete cascade,
  unique (course_version_id, position)
);
alter table public.course_checklist_items add column if not exists lesson_id uuid references public.lessons (id) on delete cascade;

create table if not exists public.checklist_ticks (
  enrolment_id uuid not null references public.enrolments (id) on delete cascade,
  item_id      uuid not null references public.course_checklist_items (id) on delete cascade,
  ticked_at    timestamptz not null default now(),
  primary key (enrolment_id, item_id)
);

alter table public.course_checklist_items enable row level security;
alter table public.checklist_ticks enable row level security;

drop policy if exists "learners read enrolled checklist" on public.course_checklist_items;
create policy "learners read enrolled checklist" on public.course_checklist_items
  for select using (course_version_id in (select public.my_course_version_ids()) or public.is_admin());
drop policy if exists "admins manage checklist" on public.course_checklist_items;
create policy "admins manage checklist" on public.course_checklist_items
  for all using (public.is_admin()) with check (public.is_admin());

-- Ticks: read own (admins read all). Writes go through set_checklist_tick.
drop policy if exists "read own ticks" on public.checklist_ticks;
create policy "read own ticks" on public.checklist_ticks
  for select using (
    public.is_admin() or enrolment_id in (select id from public.enrolments where learner_id = auth.uid()));

-- Ticks or unticks one item for a learner. Checks the item belongs to a
-- course they're currently assigned. Called by the server only.
create or replace function public.set_checklist_tick(p_learner uuid, p_item uuid, p_ticked boolean)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_enrolment uuid;
begin
  select e.id into v_enrolment
  from public.course_checklist_items i
  join public.enrolments e on e.course_version_id = i.course_version_id
  join public.profiles p on p.id = e.learner_id and p.is_active
  where i.id = p_item and e.learner_id = p_learner and e.unassigned_at is null;
  if v_enrolment is null then raise exception 'NOT_ENROLLED'; end if;

  if p_ticked then
    insert into public.checklist_ticks (enrolment_id, item_id) values (v_enrolment, p_item)
    on conflict (enrolment_id, item_id) do nothing;
  else
    delete from public.checklist_ticks where enrolment_id = v_enrolment and item_id = p_item;
  end if;
end;
$$;

revoke all on function public.set_checklist_tick(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_checklist_tick(uuid, uuid, boolean) to service_role;


-- Publishing now also copies the "I've done this" setting.
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
  v_map      jsonb := '{}'::jsonb;  -- draft lesson key -> published lesson id
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
      kind, reading_body, is_task
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
      case when v_kind = 'reading' then trim(les->>'readingBody') end,
      v_kind = 'reading' and coalesce((les->>'isTask')::boolean, false)
    )
    returning id into v_lesson;
    if coalesce(les->>'key', '') <> '' then
      v_map := v_map || jsonb_build_object(les->>'key', v_lesson);
    end if;

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

  -- Course checklist (ticked by learners, tracked only).
  insert into public.course_checklist_items (course_version_id, position, section, label, lesson_id)
  select v_id, row_number() over (order by t.n), coalesce(trim(t.c->>'section'), ''), trim(t.c->>'label'),
         (v_map ->> (t.c->>'lessonKey'))::uuid
  from jsonb_array_elements(coalesce(d->'checklist', '[]'::jsonb)) with ordinality as t(c, n)
  where coalesce(trim(t.c->>'label'), '') <> '';

  update public.courses set updated_at = now() where id = p_course_id;

  insert into public.audit_events (actor_id, action, target_type, target_id, details)
  values (p_actor, 'publish', 'course', p_course_id, jsonb_build_object('version', v_version, 'course_version_id', v_id));

  return v_id;
end;
$$;

revoke all on function public.publish_course(uuid, uuid) from public, anon, authenticated;
grant execute on function public.publish_course(uuid, uuid) to service_role;

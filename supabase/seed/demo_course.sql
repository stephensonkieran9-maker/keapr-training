-- Keapr Training: demo course seed
-- DEMONSTRATION CONTENT ONLY. Not approved Keapr training or policy.
-- Creates one labelled demo course (3 lessons, 3 questions each) and enrols
-- every admin on it, so the dashboard has something to show.
-- Run once, after 0001 and 0002, and after at least one admin exists.
-- Safe to re-run: it does nothing if the demo course already exists.

do $$
declare
  v_admin   uuid;
  v_course  uuid;
  v_version uuid;
  v_lesson  uuid;
  v_q       uuid;
  v_correct uuid;
  l int;
  q int;
  lessons text[][] := array[
    array['Demo lesson 1: How Keapr Training works', 'How lessons, videos and quizzes fit together.'],
    array['Demo lesson 2: Using your dashboard',     'Finding your next lesson and tracking progress.'],
    array['Demo lesson 3: Getting help',             'What to do if you get stuck or something breaks.']
  ];
  -- question, option A, option B, option C, correct option (1-3), explanation
  questions text[][] := array[
    -- lesson 1
    array['What unlocks the quiz for a lesson?', 'Opening the lesson page', 'Watching at least 90% of the video', 'Downloading the notes', '2', 'The quiz unlocks once you have watched at least 90% of the lesson video.'],
    array['What score do you need to pass a quiz?', '50%', '70%', '80%', '3', 'The pass mark for each quiz is 80%.'],
    array['What happens if you don''t pass?', 'You can review the lesson and try again', 'Your account is locked', 'You must restart the course', '1', 'You can review the lesson and retake the quiz as many times as you need.'],
    -- lesson 2
    array['Where do you find the next lesson to take?', 'In the Resources section', 'In the Next lesson panel at the top of the dashboard', 'In your email', '2', 'The Next lesson panel always shows the first lesson you haven''t passed yet.'],
    array['What does a padlock next to a lesson mean?', 'The lesson is locked until you pass the quiz before it', 'The lesson has been deleted', 'The lesson is optional', '1', 'Lessons unlock in order. Pass the previous quiz to open the next one.'],
    array['Can you rewatch a lesson you have already passed?', 'No, passed lessons are hidden', 'Yes, using Review', 'Only if an admin allows it', '2', 'Passed lessons stay available. Use Review to watch them again.'],
    -- lesson 3
    array['Who assigns your training courses?', 'You choose them yourself', 'Your manager or an administrator', 'They are random', '2', 'Courses are assigned to you by your manager or an administrator.'],
    array['What should you do if a video won''t play?', 'Skip the lesson', 'Use Ask for help and tell your manager', 'Create a new account', '2', 'Use Ask for help so the problem can be fixed and your progress recorded properly.'],
    array['Does a failed retry remove an earlier pass?', 'Yes', 'No, a pass is kept', 'Only after 30 days', '2', 'Once you have passed a lesson, a later failed attempt never removes that pass.']
  ];
begin
  select id into v_admin from public.profiles where role = 'admin' and is_active order by created_at limit 1;
  if v_admin is null then
    raise exception 'No active admin found. Make yourself an admin first, then run this again.';
  end if;

  if exists (select 1 from public.courses where is_demo and title = 'Demo: Welcome to Keapr Training') then
    raise notice 'Demo course already exists. Nothing to do.';
    return;
  end if;

  insert into public.courses (title, description, is_demo, created_by)
  values ('Demo: Welcome to Keapr Training', 'A short demo course showing how lessons, quizzes and progress work.', true, v_admin)
  returning id into v_course;

  insert into public.course_versions (course_id, version, title, description, published_by, is_demo)
  values (v_course, 1, 'Demo: Welcome to Keapr Training', 'A short demo course showing how lessons, quizzes and progress work.', v_admin, true)
  returning id into v_version;

  for l in 1..3 loop
    insert into public.lessons (course_version_id, position, title, objectives, notes, video_provider, video_ref, video_seconds, estimated_minutes)
    values (v_version, l, lessons[l][1], array[lessons[l][2]], 'Demo lesson notes.', 'none', 'demo/placeholder', 120, 5)
    returning id into v_lesson;

    for q in 1..3 loop
      insert into public.quiz_questions (lesson_id, position, prompt, explanation)
      values (v_lesson, q, questions[(l-1)*3+q][1], questions[(l-1)*3+q][6])
      returning id into v_q;

      insert into public.quiz_options (question_id, position, label) values
        (v_q, 1, questions[(l-1)*3+q][2]),
        (v_q, 2, questions[(l-1)*3+q][3]),
        (v_q, 3, questions[(l-1)*3+q][4]);

      select id into v_correct from public.quiz_options
      where question_id = v_q and position = questions[(l-1)*3+q][5]::int;

      insert into public.quiz_answer_keys (question_id, correct_option_id) values (v_q, v_correct);
    end loop;
  end loop;

  -- Enrol every active admin so they can try the flow.
  insert into public.enrolments (learner_id, course_version_id, assigned_by)
  select p.id, v_version, v_admin from public.profiles p
  where p.role = 'admin' and p.is_active
  on conflict do nothing;

  insert into public.audit_events (actor_id, action, target_type, target_id, details)
  values (v_admin, 'seed_demo', 'course', v_course, '{"note":"demo content"}'::jsonb);

  raise notice 'Demo course created and assigned to admins.';
end;
$$;

-- Keapr Training: "Getting started with Keapr Training"
-- A real (not demo) course explaining how the training app itself works.
-- It describes app behaviour only, not Keapr policy. Video lengths are
-- estimates until the videos are uploaded in the course builder.
-- Creates the course, publishes version 1 and assigns it to every active
-- person. Safe to re-run: does nothing if the course already exists.
-- Run after migrations 0001–0005, with at least one admin.

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
  o int;
  -- title, video seconds, objectives (|-separated), notes
  lessons text[][] := array[
    array['How your training works', '95',
      'Find the lesson to do next|Understand why some lessons are locked|Know that your progress is saved for you',
      'Your dashboard shows the courses assigned to you. The Next lesson panel at the top always points to the first lesson you haven''t passed yet. Lessons unlock in order, and your progress is saved as you go, so you can stop and pick up again on any device.'],
    array['Watching lessons and taking quizzes', '100',
      'Unlock a quiz by watching the lesson|Know the pass mark|Submit a quiz',
      'In this course, the quiz unlocks once you''ve watched 90% of the video. Only the parts that actually play count, so skipping ahead won''t unlock it. Answer every question, then submit. You need 80% to pass.'],
    array['Retries, finishing a course and getting help', '90',
      'Know what happens if you don''t pass|Know when a course is complete|Know where to go for help',
      'If you don''t pass, you''ll see your score and an explanation for each question. Review the lesson and try again as many times as you need. A course is complete when every required lesson is passed, and completed lessons stay available to rewatch. If something isn''t working, speak to your manager.']
  ];
  -- lesson, question, option 1, option 2, option 3, correct (1-3), explanation
  questions text[][] := array[
    array['1','Where do you find the lesson you should do next?','In the Resources section','In the Next lesson panel at the top of your dashboard','In an email from your manager','2','The Next lesson panel always shows the first lesson you haven''t passed yet.'],
    array['1','What does a padlock next to a lesson mean?','The lesson has been removed','The lesson is optional','It unlocks once you pass the quiz for the lesson before it','3','Lessons unlock in order. Pass each quiz to open the next lesson.'],
    array['1','You close the browser halfway through a lesson. What happens to your progress?','It''s saved, and you can pick up where you left off on any device','It''s lost and you start again','It''s saved only on that computer','1','Progress is saved to your account, not your device, so it follows you.'],
    array['1','Who decides which courses appear on your dashboard?','You choose them','They appear at random','Your manager or an administrator assigns them','3','Courses are assigned to you by your manager or an administrator.'],
    array['1','What does "In progress" on a course card mean?','You''ve started the course but haven''t passed every lesson yet','The course is being written','You''ve finished the course','1','In progress means you''ve started but there are still lessons to pass.'],
    array['2','In this course, how much of the video do you need to watch before the quiz unlocks?','Half of it','90% of it','Just the first minute','2','The quiz unlocks once you''ve watched 90% of the video.'],
    array['2','You drag the video to the end without watching it. Does that unlock the quiz?','Yes, reaching the end is enough','Yes, after a short wait','No, only the parts that actually play count','3','Watch time counts the parts of the video that actually played, so skipping ahead doesn''t add to it.'],
    array['2','What score do you need to pass a quiz in this course?','50%','80%','100%','2','The pass mark in this course is 80%. Each lesson shows its pass mark before you start.'],
    array['2','Can you submit a quiz with some questions left blank?','No, every question needs an answer first','Yes, blank answers are skipped','Yes, blank answers count as correct','1','The Submit button only works once every question has an answer.'],
    array['2','Where can you check how much of the video you''ve watched?','You can''t see it','In the bar under the video','On the Staff page','2','The bar under the video shows how much you''ve watched and how much is needed for the quiz.'],
    array['3','You don''t pass a quiz. What happens next?','You''re locked out of the course','You see your score and explanations, and can review the lesson and try again','You have to wait a week','2','You can review the lesson and retry as many times as you need. The next lesson stays locked until you pass.'],
    array['3','You''ve passed a lesson, then retake the quiz and fail. What happens to your pass?','It''s removed','It''s kept','It goes back to "in progress"','2','Once you''ve passed a lesson, a later attempt never takes that pass away.'],
    array['3','When is a course complete?','When you''ve watched every video','When you''ve opened every lesson','When you''ve passed every required lesson''s quiz','3','A course is complete once every required lesson has been passed.'],
    array['3','Can you rewatch a lesson you''ve already passed?','Yes, using Review','No, passed lessons are hidden','Only if an admin allows it','1','Passed lessons stay available. Use Review to watch them again.'],
    array['3','A video won''t play or something looks wrong. What should you do?','Skip the lesson','Make a new account','Tell your manager so it can be fixed','3','Let your manager know so the problem can be fixed and your progress recorded properly.']
  ];
  v_lessons uuid[] := array[]::uuid[];
begin
  select id into v_admin from public.profiles where role = 'admin' and is_active order by created_at limit 1;
  if v_admin is null then
    raise exception 'No active admin found. Make yourself an admin first.';
  end if;

  if exists (select 1 from public.courses where title = 'Getting started with Keapr Training') then
    raise notice 'Course already exists. Nothing to do.';
    return;
  end if;

  insert into public.courses (title, description, is_demo, created_by, draft)
  values ('Getting started with Keapr Training', 'How lessons, quizzes and your progress work. Takes about 10 minutes.', false, v_admin, '{}'::jsonb)
  returning id into v_course;

  insert into public.course_versions (course_id, version, title, description, published_by, is_demo)
  values (v_course, 1, 'Getting started with Keapr Training', 'How lessons, quizzes and your progress work. Takes about 10 minutes.', v_admin, false)
  returning id into v_version;

  for l in 1..3 loop
    insert into public.lessons (course_version_id, position, title, objectives, notes, video_provider, video_ref, video_seconds, estimated_minutes)
    values (v_version, l, lessons[l][1], string_to_array(lessons[l][3], '|'), lessons[l][4], 'none', '', lessons[l][2]::int, 3)
    returning id into v_lesson;
    v_lessons := v_lessons || v_lesson;
  end loop;

  q := 0;
  for o in 1..array_length(questions, 1) loop
    l := questions[o][1]::int;
    q := (select count(*) from public.quiz_questions where lesson_id = v_lessons[l]) + 1;
    insert into public.quiz_questions (lesson_id, position, prompt, explanation)
    values (v_lessons[l], q, questions[o][2], questions[o][7])
    returning id into v_q;
    insert into public.quiz_options (question_id, position, label) values
      (v_q, 1, questions[o][3]), (v_q, 2, questions[o][4]), (v_q, 3, questions[o][5]);
    select id into v_correct from public.quiz_options where question_id = v_q and position = questions[o][6]::int;
    insert into public.quiz_answer_keys (question_id, correct_option_id) values (v_q, v_correct);
  end loop;

  insert into public.enrolments (learner_id, course_version_id, assigned_by)
  select p.id, v_version, v_admin from public.profiles p where p.is_active
  on conflict do nothing;

  insert into public.audit_events (actor_id, action, target_type, target_id, details)
  values (v_admin, 'seed_course', 'course', v_course, '{"course":"getting started"}'::jsonb);

  raise notice 'Getting started course created and assigned to everyone active.';
end;
$$;

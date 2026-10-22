-- Keapr Training: adds lesson "N – Nudge the Contacts" to the SPRINT course draft
-- (10 questions word for word from the quiz document, 80% pass).
-- Existing lessons are left exactly as they are. Then upload the video in
-- the course builder and publish again.
-- Safe to re-run: does nothing if the lesson is already in the draft.

do $$
declare
  v_course uuid;
  v_draft  jsonb;
begin
  select id, draft into v_course, v_draft from public.courses where title = 'SPRINT' and archived_at is null;
  if v_course is null then
    raise exception 'Course "SPRINT" not found.';
  end if;
  if jsonb_array_length(coalesce(v_draft->'lessons', '[]'::jsonb)) = 0 then
    raise exception 'The course draft is empty. Open the course in the builder once and click Save draft, then run this again.';
  end if;
  if exists (select 1 from jsonb_array_elements(v_draft->'lessons') l where l->>'title' = 'N – Nudge the Contacts') then
    raise notice 'Lesson "N – Nudge the Contacts" is already in the course. Nothing to do.';
    return;
  end if;

  update public.courses
  set draft = jsonb_set(v_draft, '{lessons}', (v_draft->'lessons') || jsonb_build_array($lesson${
 "key": "sprint-l6",
 "title": "N – Nudge the Contacts",
 "objectives": [
  "Who you contact",
  "How you contact them",
  "What you need from every owner",
  "When to tick N"
 ],
 "notes": "This video covers the N step: contacting every owner on your list and getting everything you need from them.",
 "videoRef": "",
 "videoSeconds": 0,
 "passPercent": 80,
 "requiredWatchPercent": 90,
 "isRequired": true,
 "estimatedMinutes": null,
 "hasQuiz": true,
 "questions": [
  {
   "key": "sprint-l6-q1",
   "prompt": "Who do you contact in step N?",
   "options": [
    "The three best-looking properties",
    "Only the managed properties",
    "Everyone who matched in the database and everyone who replied to the WhatsApp post",
    "Only the owners who replied to the group post"
   ],
   "correctIndex": 2,
   "explanation": "Everyone on the list, in one pass. Nobody is worth anything until they've confirmed. Rewatch: Who you contact."
  },
  {
   "key": "sprint-l6-q2",
   "prompt": "What's the first way you contact every owner?",
   "options": [
    "WhatsApp",
    "Email",
    "Phone",
    "Whichever they prefer"
   ],
   "correctIndex": 2,
   "explanation": "Phone first, always. A call gets everything in two minutes; a WhatsApp turns into a two-hour thread. Rewatch: How you contact them."
  },
  {
   "key": "sprint-l6-q3",
   "prompt": "You phone an owner and they don't answer. What do you do?",
   "options": [
    "Leave a voicemail and wait",
    "Message them immediately, then dial the next contact",
    "Try again straight away",
    "Skip them"
   ],
   "correctIndex": 1,
   "explanation": "WhatsApp or email them while the phone's still in your hand, then keep moving. Rewatch: How you contact them."
  },
  {
   "key": "sprint-l6-q4",
   "prompt": "How long after a missed call do you call the same owner again?",
   "options": [
    "5 minutes",
    "30 minutes",
    "Next morning",
    "You don't — one call is enough"
   ],
   "correctIndex": 1,
   "explanation": "One missed call is nothing. Two missed calls and a message means they'll see you. Set a reminder so it happens. Rewatch: How you contact them."
  },
  {
   "key": "sprint-l6-q5",
   "prompt": "An owner replies on WhatsApp instead of calling back. What's your first message?",
   "options": [
    "\"What's your price?\"",
    "\"Is it okay to give you a quick call now?\"",
    "\"Can you send photos?\"",
    "\"Is it available?\""
   ],
   "correctIndex": 1,
   "explanation": "Ask to call every time. A call gets the whole picture in one conversation. Rewatch: When they reply on WhatsApp."
  },
  {
   "key": "sprint-l6-q6",
   "prompt": "An owner says \"yes, it's available\". What do you write in Notion?",
   "options": [
    "Confirmed",
    "Collecting — then keep asking until every checklist item is answered",
    "Booked",
    "Waiting"
   ],
   "correctIndex": 1,
   "explanation": "\"Available\" is the start of the conversation, not the end. Confirmed means nothing is left to ask. Rewatch: What you get — the checklist."
  },
  {
   "key": "sprint-l6-q7",
   "prompt": "The owner gives you a nightly rate. What's the next question?",
   "options": [
    "\"Can you do it cheaper?\"",
    "\"Does that include cleaning — and linen, bills, any mid-stay clean?\"",
    "\"What's the Airbnb price?\"",
    "There isn't one — a rate is enough"
   ],
   "correctIndex": 1,
   "explanation": "The number you give the client is the whole cost. Find out what's on top. Rewatch: What you get — the checklist."
  },
  {
   "key": "sprint-l6-q8",
   "prompt": "The client needs parking for two vans. How do you ask the owner?",
   "options": [
    "\"Does it have parking?\"",
    "\"Is parking nearby?\"",
    "\"The client's got two vans — can both park on the drive?\"",
    "You don't need to ask — the listing says parking: yes"
   ],
   "correctIndex": 2,
   "explanation": "Be specific. Vague questions get vague answers, and vague answers blow up later. Rewatch: What you get — the checklist."
  },
  {
   "key": "sprint-l6-q9",
   "prompt": "An owner's price is perfect and the dates are free, but they can't meet a requirement the client said was non-negotiable. What do you do?",
   "options": [
    "Put them in front of the client anyway — the price might win them over",
    "Mark them as a no, note why, and move on",
    "Ask the client to drop the requirement",
    "Mark them as Confirmed"
   ],
   "correctIndex": 1,
   "explanation": "Don't offer a property hoping the client will bend. Note why they're a no and move on. Rewatch: What you get — the checklist."
  },
  {
   "key": "sprint-l6-q10",
   "prompt": "When do you tick N?",
   "options": [
    "When every owner has replied",
    "When the 30-minute callbacks are all done",
    "When the first full pass is done — everyone phoned once and messaged if no answer",
    "When the client has chosen a property"
   ],
   "correctIndex": 2,
   "explanation": "The sprint needs you to reach everyone once, fast. Replies and second calls keep coming after N is ticked. Rewatch: Ticking N."
  }
 ]
}$lesson$::jsonb)),
      updated_at = now()
  where id = v_course;

  raise notice 'Added lesson %: "N – Nudge the Contacts". Upload its video in the course builder, then publish.', jsonb_array_length(v_draft->'lessons') + 1;
end;
$$;

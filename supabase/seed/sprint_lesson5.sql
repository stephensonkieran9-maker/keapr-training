-- Keapr Training: adds lesson "I – Inform the Groups" to the SPRINT course draft
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
  if exists (select 1 from jsonb_array_elements(v_draft->'lessons') l where l->>'title' = 'I – Inform the Groups') then
    raise notice 'Lesson "I – Inform the Groups" is already in the course. Nothing to do.';
    return;
  end if;

  update public.courses
  set draft = jsonb_set(v_draft, '{lessons}', (v_draft->'lessons') || jsonb_build_array($lesson${
 "key": "sprint-l5",
 "title": "I – Inform the Groups",
 "objectives": [
  "Why every lead gets posted",
  "The three rules for posting",
  "Writing the post",
  "What to do after posting"
 ],
 "notes": "This video covers the I step: posting the client's requirement in the WhatsApp booking groups. Have WhatsApp open while you watch.",
 "videoRef": "",
 "videoSeconds": 0,
 "passPercent": 80,
 "requiredWatchPercent": 90,
 "isRequired": true,
 "estimatedMinutes": null,
 "hasQuiz": true,
 "questions": [
  {
   "key": "sprint-l5-q1",
   "prompt": "You've already found three good options in the database and one in Hostaway. Do you still post in the WhatsApp groups?",
   "options": [
    "No — four options is plenty",
    "Yes — unconfirmed options aren't options, and the groups are your second and third line of supply",
    "Only if the bookings manager asks you to",
    "Only for leads of ten or more people"
   ],
   "correctIndex": 1,
   "explanation": "Post on every lead. Owners don't pick up and managed properties get booked while you're on the phone. Rewatch: Script opening."
  },
  {
   "key": "sprint-l5-q2",
   "prompt": "The Notion card says the lead source is WhatsApp. What do you do at step I?",
   "options": [
    "Post it in a different regional group so the original poster doesn't see it",
    "Reword it and post it in the same group",
    "Skip the post entirely, write \"Lead came via WhatsApp — not posted\" in Notes, and tick I",
    "Post it in General SA Chat only"
   ],
   "correctIndex": 2,
   "explanation": "WhatsApp in, never WhatsApp out. The operator who posted it is in these groups and would see us shopping their client round. Rewatch: Rule one."
  },
  {
   "key": "sprint-l5-q3",
   "prompt": "Which of these can go in a group post?",
   "options": [
    "The client's company name",
    "The name of the site or project they're working on",
    "The town or postcode district",
    "The full site postcode"
   ],
   "correctIndex": 2,
   "explanation": "The requirement is public; the client is not. Town or postcode district only — never the full postcode. Rewatch: Rule two."
  },
  {
   "key": "sprint-l5-q4",
   "prompt": "Why is a full postcode a problem in a group post?",
   "options": [
    "WhatsApp doesn't allow it",
    "Combined with dates and headcount, it lets a competitor work out which contract it is and go direct",
    "It makes the post too long",
    "It isn't a problem"
   ],
   "correctIndex": 1,
   "explanation": "Full postcode plus date range plus headcount identifies the job. Give \"IP2\", not \"IP2 8JU\". Rewatch: Rule two."
  },
  {
   "key": "sprint-l5-q5",
   "prompt": "The client's site is in Ipswich. Which group do you post in?",
   "options": [
    "London",
    "Midlands",
    "East of England",
    "General SA Chat"
   ],
   "correctIndex": 2,
   "explanation": "Ipswich is East of England. The wrong region gets no useful replies and makes us look like we don't know the country. Rewatch: Rule three."
  },
  {
   "key": "sprint-l5-q6",
   "prompt": "When should you check you're in the right regional group?",
   "options": [
    "Once, when you open the group",
    "Three times — when you open the group, when you've written the post, and before you hit send",
    "After posting, by reading the replies",
    "You don't need to — the groups are all the same"
   ],
   "correctIndex": 1,
   "explanation": "Triple-check. Posting in the wrong group and re-posting looks sloppy and doubles the exposure of the client. Rewatch: Rule three."
  },
  {
   "key": "sprint-l5-q7",
   "prompt": "What's the header on every post?",
   "options": [
    "BOOKING REQUEST",
    "ACCOMMODATION NEEDED",
    "The client's name",
    "There's no header — just the details"
   ],
   "correctIndex": 1,
   "explanation": "A clear \"ACCOMMODATION NEEDED\" header means people scanning the group spot a requirement in half a second. Rewatch: Writing the post."
  },
  {
   "key": "sprint-l5-q8",
   "prompt": "The client hasn't told you whether they need parking. What goes on the Parking line?",
   "options": [
    "Delete the line",
    "Guess \"yes\"",
    "Put \"flexible\" and keep the line",
    "Leave it blank"
   ],
   "correctIndex": 2,
   "explanation": "Fill every line. People reply to posts that answer their questions up front. Rewatch: Writing the post."
  },
  {
   "key": "sprint-l5-q9",
   "prompt": "How should people respond to your post, and why?",
   "options": [
    "Reply in the group, so everyone can see the offers",
    "DM you, so the offers and the deal stay ours",
    "Phone the bookings manager",
    "Email the office"
   ],
   "correctIndex": 1,
   "explanation": "Ask for a DM, not a group reply. Replies in the group are visible to every competitor. Rewatch: Writing the post."
  },
  {
   "key": "sprint-l5-q10",
   "prompt": "When do you tick \"Posted on WhatsApp\" and \"I – Posted in WhatsApp\"?",
   "options": [
    "When the first reply comes in",
    "When the lead is booked",
    "The moment the post is up",
    "At the end of the day"
   ],
   "correctIndex": 2,
   "explanation": "Tick as soon as the post is live — you don't wait for replies. Then log each DM under \"Group replies\" in Notes as it lands. Rewatch: After posting."
  }
 ]
}$lesson$::jsonb)),
      updated_at = now()
  where id = v_course;

  raise notice 'Added lesson %: "I – Inform the Groups". Upload its video in the course builder, then publish.', jsonb_array_length(v_draft->'lessons') + 1;
end;
$$;

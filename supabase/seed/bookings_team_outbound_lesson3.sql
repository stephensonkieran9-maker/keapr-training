-- Keapr Training: adds lesson 3 to "Bookings Team Outbound".
--   3. Role 2: Mastering Your Guest Scripts: video + 20-question quiz taken word for word from the quiz
--      document (Part A 1–10 existing guest script, Part B 11–20 previous
--      business guest script). Pass mark 80% (16 of 20).
-- Lessons 1 and 2 are left exactly as they are. Not published: upload the
-- video and the two PDFs (Downloads) in the course builder, preview, then
-- Publish. Safe to re-run: does nothing if lesson 3 is already there.

do $$
declare
  v_course uuid;
  v_draft  jsonb;
  v_lesson jsonb := $lesson${
 "key": "bto-l3",
 "title": "Role 2: Mastering Your Guest Scripts",
 "kind": "video",
 "isTask": false,
 "readingBody": "",
 "objectives": [
  "The two guest scripts word for word: the existing guest extension script and the previous business guest script",
  "Existing guests in four steps: confirm who they are, give the reason for the call (first refusal), ask about extending, ask where they're going next",
  "The extension question: \"Are you or the lads needing to extend at all, or add any extra rooms while you're on this job?\"",
  "If they say yes, go into options and availability; if no, \"No problem at all\", then ask where they're heading next",
  "Previous business guests in three steps: thank them, confirm they sort the digs, then \"where next?\"",
  "Ask how many lads they normally have on site, so we can hold the right properties"
 ],
 "notes": "Part A of the quiz (questions 1–10) covers the Existing Guest script. Part B (questions 11–20) covers the Previous Business Guest script. Get 16 of 20 right to pass.\n\nThe two PDFs for this lesson are under Downloads.",
 "videoRef": "",
 "videoSeconds": 0,
 "passPercent": 80,
 "requiredWatchPercent": 90,
 "isRequired": true,
 "estimatedMinutes": null,
 "hasQuiz": true,
 "questions": [
  {
   "key": "bto-l3-q1",
   "prompt": "How does the existing guest script open?",
   "options": [
    "\"Hi [Name], have you got five minutes to talk about a special offer?\"",
    "\"Hi [Name], it's [Your Name] from Keapr. You're currently staying with us at [property] in [city] from [check-in date] to [check-out date], right?\"",
    "\"Hi [Name], I'm calling to confirm your checkout time.\"",
    "\"Hi [Name], we've got a problem with your booking.\""
   ],
   "correctIndex": 1,
   "explanation": ""
  },
  {
   "key": "bto-l3-q2",
   "prompt": "What is the first thing you do in the existing guest script?",
   "options": [
    "Ask about extending",
    "Offer a discount",
    "Confirm who they are and their current stay details",
    "Ask where they're going next"
   ],
   "correctIndex": 2,
   "explanation": ""
  },
  {
   "key": "bto-l3-q3",
   "prompt": "What reason does the script give for the call?",
   "options": [
    "We're updating our records",
    "We've had a few enquiries for their dates and nearby properties, and you want to give them first refusal",
    "The cleaner needs access to the property",
    "We're closing the property for maintenance"
   ],
   "correctIndex": 1,
   "explanation": ""
  },
  {
   "key": "bto-l3-q4",
   "prompt": "What is the exact extension question in the script?",
   "options": [
    "\"Do you want to stay longer?\"",
    "\"Are you or the lads needing to extend at all, or add any extra rooms while you're on this job?\"",
    "\"Shall I book you in for another month?\"",
    "\"How long is the job going on for?\""
   ],
   "correctIndex": 1,
   "explanation": ""
  },
  {
   "key": "bto-l3-q5",
   "prompt": "If the guest says YES to extending, what do you do next?",
   "options": [
    "Tell them you'll call back tomorrow",
    "Ask where they're heading next",
    "Go into options and availability",
    "Transfer them to the closer immediately"
   ],
   "correctIndex": 2,
   "explanation": ""
  },
  {
   "key": "bto-l3-q6",
   "prompt": "If the guest says NO to extending, what is the first thing you say?",
   "options": [
    "\"Are you sure? We're very busy.\"",
    "\"No problem at all.\"",
    "\"OK, thanks for your time, bye.\"",
    "\"Can I ask why not?\""
   ],
   "correctIndex": 1,
   "explanation": ""
  },
  {
   "key": "bto-l3-q7",
   "prompt": "After the guest says no to extending, what question do you ask?",
   "options": [
    "\"Would you like to leave us a review?\"",
    "\"After [current city], where are you and the lads heading next? Any other sites coming up where you'll need digs?\"",
    "\"Who else in your company books accommodation?\"",
    "\"Did you have any issues with the property?\""
   ],
   "correctIndex": 1,
   "explanation": ""
  },
  {
   "key": "bto-l3-q8",
   "prompt": "Which example locations does the script suggest you offer when asking \"where next?\"",
   "options": [
    "London, Manchester or Birmingham",
    "Ipswich, back to [city], or somewhere else",
    "Plymouth, Bristol or Cardiff",
    "Anywhere in the UK"
   ],
   "correctIndex": 1,
   "explanation": ""
  },
  {
   "key": "bto-l3-q9",
   "prompt": "What is the correct four-step structure of the existing guest script?",
   "options": [
    "Thank them, confirm decision-maker, ask where next, ask headcount",
    "Confirm who they are, give a reason for the call (first refusal), ask about extension, ask where they're going next",
    "Ask about extension, confirm who they are, give a reason for the call, close",
    "Give a reason for the call, ask where next, confirm who they are, ask about extension"
   ],
   "correctIndex": 1,
   "explanation": ""
  },
  {
   "key": "bto-l3-q10",
   "prompt": "Which words does the script tell you to circle and emphasise in the existing guest script?",
   "options": [
    "\"Keapr\", \"property\", \"city\"",
    "\"first refusal\", \"extend at all\", \"where are you heading next\"",
    "\"enquiries\", \"nearby\", \"dates\"",
    "\"lads\", \"job\", \"rooms\""
   ],
   "correctIndex": 1,
   "explanation": ""
  },
  {
   "key": "bto-l3-q11",
   "prompt": "How does the previous business guest script open after the greeting?",
   "options": [
    "\"We've got availability this week if you need it.\"",
    "\"You booked your team in with us at [property] in [city] a little while back. I just wanted to say thanks for using us – how did the stay work out for you?\"",
    "\"Are you looking for accommodation at the moment?\"",
    "\"I'm calling about an unpaid invoice.\""
   ],
   "correctIndex": 1,
   "explanation": ""
  },
  {
   "key": "bto-l3-q12",
   "prompt": "What is the first job of the previous guest script?",
   "options": [
    "Thank them for staying and ask how the stay worked out",
    "Ask how many lads they have",
    "Ask where they're going next",
    "Offer them a loyalty discount"
   ],
   "correctIndex": 0,
   "explanation": ""
  },
  {
   "key": "bto-l3-q13",
   "prompt": "How does the script confirm you're speaking to the decision-maker?",
   "options": [
    "\"Can you put me through to your boss?\"",
    "\"You mentioned you were booking on behalf of the lads / I can see the booking was under [Company Name]. Are you usually the one who sorts accommodation for the teams when they move around?\"",
    "\"Are you the company director?\"",
    "\"Do you have authority to spend money?\""
   ],
   "correctIndex": 1,
   "explanation": ""
  },
  {
   "key": "bto-l3-q14",
   "prompt": "What two pieces of evidence does the script give you for raising the business angle?",
   "options": [
    "Their star rating and review",
    "They mentioned booking on behalf of the lads, or the booking was under a company name",
    "Their phone number and email address",
    "The length of stay and the price paid"
   ],
   "correctIndex": 1,
   "explanation": ""
  },
  {
   "key": "bto-l3-q15",
   "prompt": "If they confirm they are the decision-maker, what reason do you give for the call?",
   "options": [
    "\"We're trying to hit our monthly target.\"",
    "\"I'm mapping where our regular crews are working over the next few months so we can hold the right properties.\"",
    "\"Our manager asked me to ring everyone.\"",
    "\"We've got too many empty rooms.\""
   ],
   "correctIndex": 1,
   "explanation": ""
  },
  {
   "key": "bto-l3-q16",
   "prompt": "What is the \"where next?\" question in the previous guest script?",
   "options": [
    "\"Are you coming back soon?\"",
    "\"After [city], where have you got people now, and where are they likely heading next – back to [city], Ipswich, somewhere else?\"",
    "\"What's your next contract worth?\"",
    "\"Which cities do you work in?\""
   ],
   "correctIndex": 1,
   "explanation": ""
  },
  {
   "key": "bto-l3-q17",
   "prompt": "What is the final question in the previous guest script?",
   "options": [
    "\"Can I send you a brochure?\"",
    "\"What budget do you have per night?\"",
    "\"Roughly how many lads do you normally have on site at a time when you're busy?\"",
    "\"Would you recommend us to other companies?\""
   ],
   "correctIndex": 2,
   "explanation": ""
  },
  {
   "key": "bto-l3-q18",
   "prompt": "Why do you ask how many lads they usually have on site?",
   "options": [
    "To decide whether to charge them more",
    "To understand the size of future demand so we can hold the right properties",
    "To check they didn't break occupancy limits last time",
    "To calculate the cleaning fee"
   ],
   "correctIndex": 1,
   "explanation": ""
  },
  {
   "key": "bto-l3-q19",
   "prompt": "What is the correct three-step structure of the previous guest script?",
   "options": [
    "Confirm stay, ask about extension, ask where next",
    "Thank, confirm decision-maker, then \"where next?\"",
    "Pitch, discount, close",
    "Confirm company name, ask headcount, send proposal"
   ],
   "correctIndex": 1,
   "explanation": ""
  },
  {
   "key": "bto-l3-q20",
   "prompt": "What is the key difference between the two scripts?",
   "options": [
    "The existing guest script is about extensions and first refusal on a current stay; the previous guest script is about thanking them, confirming they sort digs, and mapping future sites",
    "The existing guest script is longer and more formal",
    "The previous guest script is only used for insurance companies",
    "There is no real difference – you use whichever you prefer"
   ],
   "correctIndex": 0,
   "explanation": ""
  }
 ],
 "downloads": []
}$lesson$::jsonb;
begin
  select id, draft into v_course, v_draft from public.courses where title = 'Bookings Team Outbound' order by created_at limit 1;
  if v_course is null then
    raise exception 'No course called "Bookings Team Outbound". Run bookings_team_outbound.sql first.';
  end if;
  if exists (select 1 from jsonb_array_elements(coalesce(v_draft->'lessons', '[]'::jsonb)) l
             where l->>'key' = 'bto-l3' or l->>'title' = v_lesson->>'title') then
    raise notice 'Lesson 3 is already in the course. Nothing to do.';
    return;
  end if;

  update public.courses
  set draft = jsonb_set(coalesce(draft, '{}'::jsonb), '{lessons}', coalesce(draft->'lessons', '[]'::jsonb) || jsonb_build_array(v_lesson)),
      description = 'Role 2: calling existing and previous guests. Three videos, each followed by a quiz.',
      updated_at = now()
  where id = v_course;
  raise notice 'Added lesson 3 to "Bookings Team Outbound". Upload its video and the two PDFs, preview, then publish.';
end $$;

-- Keapr Training: adds lesson "T – Table the Options" to the SPRINT course draft
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
  if exists (select 1 from jsonb_array_elements(v_draft->'lessons') l where l->>'title' = 'T – Table the Options') then
    raise notice 'Lesson "T – Table the Options" is already in the course. Nothing to do.';
    return;
  end if;

  update public.courses
  set draft = jsonb_set(v_draft, '{lessons}', (v_draft->'lessons') || jsonb_build_array($lesson${
 "key": "sprint-l7",
 "title": "T – Table the Options",
 "objectives": [
  "Who you table options to",
  "What a complete option includes",
  "Finding platform links and checking reviews",
  "Writing it up and ticking T"
 ],
 "notes": "This video covers the T step: writing up every confirmed option in full and tabling it to the bookings manager.",
 "videoRef": "",
 "videoSeconds": 0,
 "passPercent": 80,
 "requiredWatchPercent": 90,
 "isRequired": true,
 "estimatedMinutes": null,
 "hasQuiz": true,
 "questions": [
  {
   "key": "sprint-l7-q1",
   "prompt": "For now, who do you table the options to?",
   "options": [
    "Straight to the client",
    "The bookings manager, who presents them to the client",
    "The owner",
    "The WhatsApp group"
   ],
   "correctIndex": 1,
   "explanation": "Every lead goes to the bookings manager first. Once you've run a few cleanly, you'll start presenting to clients yourself. Rewatch: Script opening."
  },
  {
   "key": "sprint-l7-q2",
   "prompt": "What's the test for whether an option has been properly tabled?",
   "options": [
    "The owner has confirmed availability",
    "The bookings manager could put it in front of the client without asking you a single question",
    "The price is under budget",
    "It's on Airbnb"
   ],
   "correctIndex": 1,
   "explanation": "If he has to ask \"what are the reviews on Booking.com?\", the option isn't tabled yet. Rewatch: What \"everything\" means."
  },
  {
   "key": "sprint-l7-q3",
   "prompt": "An owner came from the database. Where do you find their first platform link?",
   "options": [
    "Google",
    "The OTA button on their card in the property finder",
    "Ask the bookings manager",
    "The WhatsApp group"
   ],
   "correctIndex": 1,
   "explanation": "The OTA button opens their listing. From there, find the other platform. Rewatch: Finding the platform links."
  },
  {
   "key": "sprint-l7-q4",
   "prompt": "You have the Airbnb link but can't find the property on Booking.com. What do you do?",
   "options": [
    "Skip it — one platform is enough",
    "Search the property name, street and town on Booking.com; match the photos; if still nothing, ask the owner for the link",
    "Mark the property as a no",
    "Assume it's not on Booking.com"
   ],
   "correctIndex": 1,
   "explanation": "Nearly every owner is on both. Search, match the photos, and ask the owner directly if you can't find it. Rewatch: Finding the platform links."
  },
  {
   "key": "sprint-l7-q5",
   "prompt": "A property is 4.9 on Airbnb with 12 reviews and 6.1 on Booking.com with 80 reviews. What does that tell you?",
   "options": [
    "It's a great property — the Airbnb score proves it",
    "The Booking.com score is probably the truer picture for a contractor group, and the mismatch must be flagged",
    "Ignore both — reviews don't matter",
    "Average the two scores"
   ],
   "correctIndex": 1,
   "explanation": "Different guests tell different stories. For a long workforce stay, blunt Booking.com reviews from working guests usually matter more. Rewatch: Checking the reviews."
  },
  {
   "key": "sprint-l7-q6",
   "prompt": "Which reviews should you read most closely?",
   "options": [
    "The oldest ones",
    "The five-star ones",
    "The most recent five or six, and anything that comes up more than once",
    "Only the overall score"
   ],
   "correctIndex": 2,
   "explanation": "A property that was great two years ago and has had three complaints this month is not great. Repeated issues are what hit us at week two. Rewatch: Checking the reviews."
  },
  {
   "key": "sprint-l7-q7",
   "prompt": "The reviews are bad on both platforms but the price is perfect and the dates are free. What do you do?",
   "options": [
    "Table it — the client can decide",
    "Table it as option 3",
    "It's a no — note why and leave it out",
    "Ask the owner to explain the reviews"
   ],
   "correctIndex": 2,
   "explanation": "We'd rather lose a booking than win one that loses us a client. Bad on both means no, whatever the price. Rewatch: Checking the reviews."
  },
  {
   "key": "sprint-l7-q8",
   "prompt": "How many options do you present, and in what order?",
   "options": [
    "All of them, cheapest first",
    "One — the best",
    "Three, your recommendation first with one line on why",
    "Five, closest first"
   ],
   "correctIndex": 2,
   "explanation": "Three is the right number. Lead with your recommendation; the bookings manager wants your judgement, not a menu. Rewatch: Writing it up."
  },
  {
   "key": "sprint-l7-q9",
   "prompt": "What must the Rate line in the write-up include?",
   "options": [
    "Nightly rate only",
    "Nightly rate, the total for the stay, and what's included or extra — cleaning, linen, bills",
    "The Airbnb price",
    "\"Best rates\""
   ],
   "correctIndex": 1,
   "explanation": "The figure that goes to the client is the whole cost. If anything is extra, the figure goes in. Rewatch: What \"everything\" means."
  },
  {
   "key": "sprint-l7-q10",
   "prompt": "When do you tick T?",
   "options": [
    "When the client has chosen a property",
    "When the write-up is in Notion, you've messaged the bookings manager, and the status is moved to Offers found",
    "When the owner has confirmed",
    "When the bookings manager has sent the options to the client"
   ],
   "correctIndex": 1,
   "explanation": "T is ticked once the options are written up and tabled. Offer sent comes when the bookings manager has sent them on. Rewatch: Tabling it."
  }
 ]
}$lesson$::jsonb)),
      updated_at = now()
  where id = v_course;

  raise notice 'Added lesson %: "T – Table the Options". Upload its video in the course builder, then publish.', jsonb_array_length(v_draft->'lessons') + 1;
end;
$$;

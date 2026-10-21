-- Keapr Training: adds lesson "R – Review Hostaway" to the SPRINT course draft
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
  if exists (select 1 from jsonb_array_elements(v_draft->'lessons') l where l->>'title' = 'R – Review Hostaway') then
    raise notice 'Lesson "R – Review Hostaway" is already in the course. Nothing to do.';
    return;
  end if;

  update public.courses
  set draft = jsonb_set(v_draft, '{lessons}', (v_draft->'lessons') || jsonb_build_array($lesson${
 "key": "sprint-l4",
 "title": "R – Review Hostaway",
 "objectives": [
  "Why we check Hostaway by hand",
  "Reading the Multi calendar",
  "Narrowing it to the area",
  "Checking the listing fits the brief"
 ],
 "notes": "This video covers the R step: checking availability by hand in Hostaway and making sure each property fits the client's brief. Have Hostaway open while you watch.",
 "videoRef": "",
 "videoSeconds": 0,
 "passPercent": 80,
 "requiredWatchPercent": 90,
 "isRequired": true,
 "estimatedMinutes": null,
 "hasQuiz": true,
 "questions": [
  {
   "key": "sprint-l4-q1",
   "prompt": "The property finder is already connected to Hostaway. Why do we still check Hostaway by hand?",
   "options": [
    "The property finder doesn't include managed properties",
    "The sync isn't live to the minute, so a recent cancellation or a new block won't show in the finder yet",
    "Hostaway has better photos",
    "We don't — if the finder shows it as available, that's enough"
   ],
   "correctIndex": 1,
   "explanation": "The finder tells you a property exists; Hostaway tells you whether it's actually free on the exact dates, right now. It's a second lock on the door. Rewatch: Script opening."
  },
  {
   "key": "sprint-l4-q2",
   "prompt": "On the Multi calendar, what does a teal or orange bar across a row mean?",
   "options": [
    "The property is available",
    "The property is booked for those dates",
    "The property is blocked by ops",
    "The nightly rate has changed"
   ],
   "correctIndex": 1,
   "explanation": "Coloured bars are bookings — teal for direct/Hostaway, orange for Airbnb. Those dates are gone. Rewatch: The multi calendar."
  },
  {
   "key": "sprint-l4-q3",
   "prompt": "What does a grey bar labelled \"Blocked as per owner\" or \"Pest control\" mean, and what do you do?",
   "options": [
    "It's a booking — move on",
    "It's a block, not a booking — ask ops whether it can move before ruling the property out",
    "The property has been removed from the portfolio",
    "The property is free — ignore the label"
   ],
   "correctIndex": 1,
   "explanation": "Grey means a block. A block can sometimes move; a booking never can. Rewatch: The multi calendar."
  },
  {
   "key": "sprint-l4-q4",
   "prompt": "What does a price shown in an empty calendar cell tell you?",
   "options": [
    "The cleaning fee for that property",
    "The total price for the whole stay",
    "That night is available, and that's the nightly rate for that date",
    "The price a competitor is charging"
   ],
   "correctIndex": 2,
   "explanation": "A run of prices with no bars across the client's dates is what you're looking for. Rewatch: The multi calendar."
  },
  {
   "key": "sprint-l4-q5",
   "prompt": "What's the quickest way to cut the Multi calendar down to one area?",
   "options": [
    "Scroll through all 66 listings",
    "Type the town into the Search by listing box",
    "Open each listing one at a time",
    "Export the calendar to a spreadsheet"
   ],
   "correctIndex": 1,
   "explanation": "Search by listing drops the calendar to just that area's listings. The City dropdown or Tags work too. Rewatch: Narrowing it to the area."
  },
  {
   "key": "sprint-l4-q6",
   "prompt": "A property is free for most of the client's dates but has a two-night booking in the middle. What do you do?",
   "options": [
    "Rule it out — it's not fully available",
    "Offer it anyway without mentioning the gap",
    "Note the gap — the client may be flexible, or a second property may cover it",
    "Cancel the two-night booking"
   ],
   "correctIndex": 2,
   "explanation": "Flag the gap in Notes. Clients are sometimes flexible by a night or two, and a second property can sometimes cover it. Rewatch: Narrowing it to the area."
  },
  {
   "key": "sprint-l4-q7",
   "prompt": "The calendar shows the property is free. What do you check next, and where?",
   "options": [
    "Nothing — a free calendar is enough",
    "Open the listing page to confirm guests, bedrooms, beds, parking and fees",
    "Phone the owner",
    "Post it in the WhatsApp groups"
   ],
   "correctIndex": 1,
   "explanation": "A free calendar isn't enough — the property has to fit the brief. The listing page has everything you need. Rewatch: Checking the listing itself."
  },
  {
   "key": "sprint-l4-q8",
   "prompt": "On the listing page for a workforce group, which three numbers matter most?",
   "options": [
    "Listing ID, status and channels",
    "Guests, bedrooms and beds",
    "Airbnb rating, number of reviews and response rate",
    "Check-in time, check-out time and cancellation policy"
   ],
   "correctIndex": 1,
   "explanation": "Eight guests, four bedrooms, five beds means eight people with a bed each and nobody on a sofa. Rewatch: Checking the listing itself."
  },
  {
   "key": "sprint-l4-q9",
   "prompt": "When noting the price for a Hostaway match in Notion, what do you include?",
   "options": [
    "The nightly rate only",
    "The nightly rate and the cleaning fee and any other fees",
    "The Airbnb price",
    "Whatever the property finder showed"
   ],
   "correctIndex": 1,
   "explanation": "The figure you give the client in step T is the whole cost, not just the nightly rate. Rewatch: Checking the listing itself."
  },
  {
   "key": "sprint-l4-q10",
   "prompt": "There's nothing free in Hostaway for the client's dates. What do you do with the checkboxes?",
   "options": [
    "Leave \"Search Hostaway\" and \"R\" unticked",
    "Tick both and write \"Nothing in Hostaway for these dates\" in Notes",
    "Tick R only",
    "Mark the lead as Lost"
   ],
   "correctIndex": 1,
   "explanation": "The tick means you looked, not that you found something. Note the empty result so the next person knows. Rewatch: Into Notion."
  }
 ]
}$lesson$::jsonb)),
      updated_at = now()
  where id = v_course;

  raise notice 'Added lesson %: "R – Review Hostaway". Upload its video in the course builder, then publish.', jsonb_array_length(v_draft->'lessons') + 1;
end;
$$;

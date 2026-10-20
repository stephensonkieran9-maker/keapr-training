-- Keapr Training: adds lesson "P – Pull the Database" to the SPRINT course draft
-- (10 questions word for word from the quiz document, 80% pass). The lesson
-- notes include the Property Finder link, shown as a button at the top of
-- the lesson. Existing lessons are left exactly as they are. Then upload
-- the video in the course builder and publish again.
-- Safe to re-run: does nothing if the lesson is already in the draft.

do $$
declare
  v_course uuid;
  v_draft  jsonb;
begin
  select id, draft into v_course, v_draft from public.courses where title = 'SPRINT' and archived_at is null;
  if v_course is null then
    raise exception 'Course "SPRINT" not found. Run sprint_course.sql first.';
  end if;
  if jsonb_array_length(coalesce(v_draft->'lessons', '[]'::jsonb)) = 0 then
    raise exception 'The course draft is empty. Open the course in the builder once and click Save draft, then run this again.';
  end if;
  if exists (select 1 from jsonb_array_elements(v_draft->'lessons') l where l->>'title' = 'P – Pull the Database') then
    raise notice 'Lesson "P – Pull the Database" is already in the course. Nothing to do.';
    return;
  end if;

  update public.courses
  set draft = jsonb_set(v_draft, '{lessons}', (v_draft->'lessons') || jsonb_build_array($lesson${
 "key": "sprint-l3",
 "title": "P – Pull the Database",
 "objectives": [
  "What the Property Finder searches",
  "Running a search",
  "Reading the results",
  "Building a shortlist"
 ],
 "notes": "This video covers the P step: searching our internal Property Finder for properties near the client's site. Have it open while you watch.\n\nProperty Finder:\nhttps://cozynights-m2t79s2p.manus.space/",
 "videoRef": "",
 "videoSeconds": 0,
 "passPercent": 80,
 "requiredWatchPercent": 90,
 "isRequired": true,
 "estimatedMinutes": null,
 "hasQuiz": true,
 "questions": [
  {
   "key": "sprint-l3-q1",
   "prompt": "What two sources does the Property Finder search in one go?",
   "options": [
    "Airbnb and Booking.com",
    "The Notion owner database and our Hostaway account",
    "The WhatsApp groups and Facebook groups",
    "Google Maps and Rightmove"
   ],
   "correctIndex": 1,
   "explanation": "It's connected to the Notion database of partner owners and to Hostaway, where our managed properties live. Rewatch: Script opening."
  },
  {
   "key": "sprint-l3-q2",
   "prompt": "When entering the location, what should you use whenever you have it?",
   "options": [
    "The client's company name",
    "The nearest city",
    "The site postcode",
    "The county"
   ],
   "correctIndex": 2,
   "explanation": "Postcode is granular — the distances come back measured from the exact spot the client needs to be. Only use the town if you don't have a postcode. Rewatch: Running the search."
  },
  {
   "key": "sprint-l3-q3",
   "prompt": "Why does the Brand selector (Cozy Nights / Red Steps) matter?",
   "options": [
    "It changes which properties are shown",
    "It changes the messaging the tool generates later",
    "It's only for reporting",
    "It doesn't — pick either"
   ],
   "correctIndex": 1,
   "explanation": "Pick the brand the lead came in under; it sets the branding on messages generated later. Rewatch: Running the search."
  },
  {
   "key": "sprint-l3-q4",
   "prompt": "What does a purple \"Managed\" badge on a card mean?",
   "options": [
    "The property is managed by a partner agency",
    "The property is one we run ourselves through Hostaway",
    "The owner has been contacted already",
    "The property is fully booked"
   ],
   "correctIndex": 1,
   "explanation": "Managed = our own portfolio. Partner (teal) = an owner from the Notion database. Rewatch: Reading the results."
  },
  {
   "key": "sprint-l3-q5",
   "prompt": "Why do managed properties come first on the shortlist?",
   "options": [
    "They're always cheaper",
    "They're always closer",
    "We control the calendar and pricing, and the money stays in the business",
    "Partner owners don't like being contacted"
   ],
   "correctIndex": 2,
   "explanation": "Managed is our best outcome — but managed stock is limited, so partner properties still go on the shortlist. Rewatch: Reading the results."
  },
  {
   "key": "sprint-l3-q6",
   "prompt": "What extra information does a Partner card show that a Managed card doesn't?",
   "options": [
    "The 28-night price",
    "The owner's name, phone number and email",
    "The listing photos",
    "The property's rating"
   ],
   "correctIndex": 1,
   "explanation": "Partner cards carry the owner's contact details (and parking). Managed cards show the 28-night total and per-night rate instead. Rewatch: Reading the results."
  },
  {
   "key": "sprint-l3-q7",
   "prompt": "What is the map view for?",
   "options": [
    "Checking whether the property has parking",
    "Sanity-checking real-world distance and drive time, not just miles as the crow flies",
    "Seeing the property photos",
    "Booking the property directly"
   ],
   "correctIndex": 1,
   "explanation": "A property 15 miles away might be a 40-minute drive on the wrong side of an estuary. Inside about 20–30 minutes' drive is in play for workforce clients. Rewatch: Using the map."
  },
  {
   "key": "sprint-l3-q8",
   "prompt": "How many properties should be on your shortlist, and why?",
   "options": [
    "One — the closest",
    "Three to five — some owners won't reply in time and the client wants a choice",
    "All twenty",
    "As many managed properties as there are, and no partners"
   ],
   "correctIndex": 1,
   "explanation": "Not one — a shortlist. Owners drop out and clients want options. Rewatch: Building the shortlist."
  },
  {
   "key": "sprint-l3-q9",
   "prompt": "The search returns nothing within a sensible distance. What do you do?",
   "options": [
    "Leave \"Search Manus\" and \"P\" unticked",
    "Tick both boxes and write \"No database matches within 30 min\" in Notes",
    "Widen the search to 100 miles and shortlist those",
    "Mark the lead as Lost"
   ],
   "correctIndex": 1,
   "explanation": "The tick means you looked. Note the empty result so the next person knows — Hostaway and the WhatsApp groups will have to carry this one. Rewatch: Building the shortlist."
  },
  {
   "key": "sprint-l3-q10",
   "prompt": "What is the WhatsApp Message Generator at the bottom of the page for, and when do you use it?",
   "options": [
    "Messaging partner owners during step P",
    "Posting the requirement in the WhatsApp groups during step I",
    "Writing a branded message with the listing link to send to the client, used in step T",
    "Logging the lead in Notion"
   ],
   "correctIndex": 2,
   "explanation": "It drafts a guest-facing message with the property details and 28-night price. You don't use it in P — you come back to it when tabling options. Rewatch: The message generator."
  }
 ]
}$lesson$::jsonb)),
      updated_at = now()
  where id = v_course;

  raise notice 'Added lesson %: "P – Pull the Database". Upload its video in the course builder, then publish.', jsonb_array_length(v_draft->'lessons') + 1;
end;
$$;

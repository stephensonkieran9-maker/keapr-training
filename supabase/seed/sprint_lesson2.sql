-- Keapr Training: adds lesson "S – Store It" to the SPRINT course draft
-- (10 questions word for word from the quiz document, 80% pass). The lesson
-- notes include the link to the SPRINT – External Offers board in Notion.
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
    raise exception 'Course "SPRINT" not found. Run sprint_course.sql first.';
  end if;
  if jsonb_array_length(coalesce(v_draft->'lessons', '[]'::jsonb)) = 0 then
    raise exception 'The course draft is empty. Open the course in the builder once and click Save draft, then run this again.';
  end if;
  if exists (select 1 from jsonb_array_elements(v_draft->'lessons') l where l->>'title' = 'S – Store It') then
    raise notice 'Lesson "S – Store It" is already in the course. Nothing to do.';
    return;
  end if;

  update public.courses
  set draft = jsonb_set(v_draft, '{lessons}', (v_draft->'lessons') || jsonb_build_array($lesson${
 "key": "sprint-l2",
 "title": "S – Store It",
 "objectives": [
  "Where every lead is logged",
  "How to create a lead card",
  "Using the checkboxes",
  "Moving a card through the statuses"
 ],
 "notes": "This video covers the first SPRINT step: logging every new enquiry in Notion before you do anything else. Keep the board open while you watch.\n\nSPRINT – External Offers board in Notion:\nhttps://app.notion.com/p/312f9f68462543f9be5d5bf676aaf536?v=b2f6aebe5e93441e973b50e10b667770&source=copy_link",
 "videoRef": "",
 "videoSeconds": 0,
 "passPercent": 80,
 "requiredWatchPercent": 90,
 "isRequired": true,
 "estimatedMinutes": null,
 "hasQuiz": true,
 "questions": [
  {
   "key": "sprint-l2-q1",
   "prompt": "A new enquiry has just come in. Which of these do you do first?",
   "options": [
    "Reply to the client to acknowledge it",
    "Search the Manus database",
    "Create the lead card in Notion",
    "Post the requirement in the WhatsApp groups"
   ],
   "correctIndex": 2,
   "explanation": "The lead goes into Notion before anything else — before you reply, before you search. Rewatch: Creating the lead."
  },
  {
   "key": "sprint-l2-q2",
   "prompt": "Which Notion board does every lead go into?",
   "options": [
    "Guest/Owner Services",
    "SPRINT – External Offers",
    "SPRINT – Leads",
    "Hostaway Bookings"
   ],
   "correctIndex": 1,
   "explanation": "SPRINT – External Offers, which sits under Guest/Owner Services. Rewatch: Script opening."
  },
  {
   "key": "sprint-l2-q3",
   "prompt": "What's the naming format for a new lead card?",
   "options": [
    "The client's company name",
    "The date it came in",
    "SPRINT – [area]/[source], e.g. SPRINT – Ipswich/SQ",
    "Your own name and the date"
   ],
   "correctIndex": 2,
   "explanation": "Same format every time so the board is scannable at a glance. Rewatch: Creating the lead."
  },
  {
   "key": "sprint-l2-q4",
   "prompt": "You've got the dates, area and headcount but no budget. What do you do with the Budget (total) property?",
   "options": [
    "Put in a sensible estimate",
    "Leave it empty and keep going",
    "Don't save the card until you've asked the client",
    "Write \"TBC\" in it"
   ],
   "correctIndex": 1,
   "explanation": "Fill what you have, leave the rest empty. Never guess, and never delay logging because something's missing. Rewatch: Creating the lead."
  },
  {
   "key": "sprint-l2-q5",
   "prompt": "Where do the client's contact name, phone number and email go?",
   "options": [
    "In the card title",
    "In the Lead source property",
    "At the top of the Notes property",
    "They don't go in Notion — keep them in your email"
   ],
   "correctIndex": 2,
   "explanation": "Contact details go first in Notes, because you'll need them in step N. Rewatch: Creating the lead."
  },
  {
   "key": "sprint-l2-q6",
   "prompt": "What status does a brand-new card get, and what do you tick?",
   "options": [
    "Status \"Searching\", tick P",
    "Status \"New lead\", tick S – Stored in Notion",
    "Status \"New lead\", tick nothing until the search is done",
    "Status \"Offers found\", tick S"
   ],
   "correctIndex": 1,
   "explanation": "Set Status to New lead and tick S the moment the card is saved. That starts the 30-minute clock. Rewatch: Creating the lead."
  },
  {
   "key": "sprint-l2-q7",
   "prompt": "You searched Airbnb and found nothing for the client's dates. What do you do with the \"Search Airbnb\" checkbox?",
   "options": [
    "Leave it unticked because nothing was found",
    "Tick it and write \"Nothing on Airbnb for these dates\" in Notes",
    "Delete the checkbox for this lead",
    "Tick it only if the bookings manager asks"
   ],
   "correctIndex": 1,
   "explanation": "A tick means \"I looked\", not \"I found something\". Every box gets ticked on every lead. Rewatch: The checkboxes."
  },
  {
   "key": "sprint-l2-q8",
   "prompt": "When should you tick the checkboxes on a lead?",
   "options": [
    "All at once when the lead is finished",
    "At the end of each day",
    "Each one the moment that step or search is done",
    "Only the six SPRINT step boxes — the search boxes are optional"
   ],
   "correctIndex": 2,
   "explanation": "Tick as you go so the card is always true. An unticked box tells the bookings manager that search hasn't been done. Rewatch: The checkboxes."
  },
  {
   "key": "sprint-l2-q9",
   "prompt": "When do you move a card from \"New lead\" to \"Searching\"?",
   "options": [
    "When the first confirmed option comes in",
    "The moment you start step P",
    "When the options have been sent to the client",
    "When the bookings manager tells you to"
   ],
   "correctIndex": 1,
   "explanation": "Drag it to Searching as soon as you start searching. Offers found is for when you have a confirmed option; Offer sent is T ticked. Rewatch: Moving the status."
  },
  {
   "key": "sprint-l2-q10",
   "prompt": "A lead goes to \"Lost\". What else do you do?",
   "options": [
    "Nothing — the status says it all",
    "Delete the card to keep the board tidy",
    "Write why it was lost in Notes",
    "Move it back to New lead so it can be worked again"
   ],
   "correctIndex": 2,
   "explanation": "Note the reason it was lost. It helps us next time and keeps the record complete. Rewatch: Moving the status."
  }
 ]
}$lesson$::jsonb)),
      updated_at = now()
  where id = v_course;

  raise notice 'Added lesson %: "S – Store It". Upload its video in the course builder, then publish.', jsonb_array_length(v_draft->'lessons') + 1;
end;
$$;

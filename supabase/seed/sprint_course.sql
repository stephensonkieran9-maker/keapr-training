-- Keapr Training: "SPRINT" course (draft), lesson 1 "The SPRINT process".
-- 10 quiz questions word for word from the SPRINT quiz document; pass mark
-- 80% (8 of 10). NOT published: upload the video in the course builder,
-- check with Preview as learner, then Publish and assign.
-- Safe to re-run: does nothing if a course with this title already exists.

do $$
declare
  v_admin uuid;
begin
  select id into v_admin from public.profiles where role = 'admin' and is_active order by created_at limit 1;
  if v_admin is null then
    raise exception 'No active admin found.';
  end if;
  if exists (select 1 from public.courses where title = 'SPRINT') then
    raise notice 'A course called "SPRINT" already exists. Nothing to do.';
    return;
  end if;

  insert into public.courses (title, description, is_demo, created_by, draft)
  values ('SPRINT', 'Our speed-to-lead process for handling incoming accommodation enquiries.', false, v_admin, $draft${
 "lessons": [
  {
   "key": "sprint-l1",
   "title": "The SPRINT process",
   "objectives": [
    "What each letter of SPRINT stands for",
    "The order the steps happen in",
    "How to search for and confirm availability",
    "How to contact owners and present options",
    "The time targets for a sprint"
   ],
   "notes": "SPRINT is our speed-to-lead process for handling incoming accommodation enquiries. This video walks through the six steps in order and the clock you're working to. The quiz tells you which section to rewatch for any question you get wrong.",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 80,
   "requiredWatchPercent": 90,
   "isRequired": true,
   "estimatedMinutes": null,
   "hasQuiz": true,
   "questions": [
    {
     "key": "sprint-l1-q1",
     "prompt": "A lead comes in by email while you're on the phone to a guest. What's the first thing you do once you hang up?",
     "options": [
      "Reply to the email so the client knows we've seen it",
      "Search the Manus database to see what we've got",
      "Log the lead in Notion and tick S",
      "Post it in the WhatsApp groups"
     ],
     "correctIndex": 2,
     "explanation": "Nothing happens until the lead is logged. Log it first, then reply. Rewatch: Section 3 – S."
    },
    {
     "key": "sprint-l1-q2",
     "prompt": "Why does S come before everything else?",
     "options": [
      "Notion needs the record to generate the WhatsApp post",
      "An unlogged lead only exists in your head — if you get pulled away, nobody else can see it or pick it up",
      "The bookings manager has to approve every lead before it's worked",
      "It doesn't — you can log it at the end as long as all six boxes get ticked"
     ],
     "correctIndex": 1,
     "explanation": "Logging makes the lead visible to the whole team and starts the clock. Rewatch: Section 3 – S."
    },
    {
     "key": "sprint-l1-q3",
     "prompt": "Roughly how many property owners are connected to the Manus database?",
     "options": [
      "About 100",
      "About 250",
      "About 1,000",
      "About 5,000"
     ],
     "correctIndex": 2,
     "explanation": "Around 1,000 owners who have asked us for extra bookings — our biggest supply advantage. Rewatch: Section 4 – P."
    },
    {
     "key": "sprint-l1-q4",
     "prompt": "The Manus database is connected to Hostaway. Why do you still check Hostaway by hand in step R?",
     "options": [
      "The sync isn't live to the minute, and only Hostaway shows the actual calendar, recent cancellations and blocks",
      "The database doesn't include any of our managed properties",
      "Hostaway has better photos",
      "You don't — if the database shows a Hostaway property as available, that's enough"
     ],
     "correctIndex": 0,
     "explanation": "The database tells you a property exists; Hostaway tells you whether it's free right now. Rewatch: Section 5 – R."
    },
    {
     "key": "sprint-l1-q5",
     "prompt": "You've found three good options in the database and one in Hostaway. Do you still post in the WhatsApp groups?",
     "options": [
      "No — you've got enough options already",
      "Only if the client asked for more than three options",
      "Yes — unconfirmed options aren't options, and the groups are a second line of supply that costs two minutes",
      "Only if the lead is for more than ten people"
     ],
     "correctIndex": 2,
     "explanation": "Post on every lead. Options fall through; the groups are your backup. Rewatch: Section 6 – I."
    },
    {
     "key": "sprint-l1-q6",
     "prompt": "Which of these must NEVER go in a WhatsApp group post?",
     "options": [
      "The number of guests",
      "The dates",
      "The client's name or company",
      "The town or postcode district"
     ],
     "correctIndex": 2,
     "explanation": "Competitors are in the groups. The requirement is public; the client is not. Rewatch: Section 6 – I."
    },
    {
     "key": "sprint-l1-q7",
     "prompt": "In step N, what's the correct order of contact?",
     "options": [
      "Email, then WhatsApp, then phone",
      "WhatsApp, then phone, then email",
      "Phone, then WhatsApp, then email",
      "Whichever the owner has said they prefer"
     ],
     "correctIndex": 2,
     "explanation": "Fastest channel first. A call gets a yes/no in two minutes. Rewatch: Section 7 – N."
    },
    {
     "key": "sprint-l1-q8",
     "prompt": "You phone an owner and they don't pick up. What do you do?",
     "options": [
      "Leave a voicemail and wait for them to call back",
      "Send a WhatsApp immediately, then dial the next contact without waiting for a reply",
      "Try them again in 15 minutes before moving on",
      "Skip them — if they don't answer, they're not serious"
     ],
     "correctIndex": 1,
     "explanation": "WhatsApp the second they don't answer, then keep moving through the list. Rewatch: Section 7 – N."
    },
    {
     "key": "sprint-l1-q9",
     "prompt": "How many options do you present to the client in step T, and in what order?",
     "options": [
      "All of them, cheapest first",
      "Three, with your recommendation first and one line on why",
      "One — the best — so they don't have to choose",
      "Five, ordered by distance from the site"
     ],
     "correctIndex": 1,
     "explanation": "Three options, best fit first, with a recommendation. Clients want a recommendation, not a menu. Rewatch: Section 8 – T."
    },
    {
     "key": "sprint-l1-q10",
     "prompt": "What are the time targets for ticking I and ticking T, measured from the lead landing?",
     "options": [
      "I within 15 minutes, T within 30 minutes",
      "I within 1 hour, T by end of day",
      "I within 5 minutes, T within 1 hour",
      "I within 25 minutes, T within 2 hours"
     ],
     "correctIndex": 0,
     "explanation": "Groups posted by 15 minutes; options with the client by 30 minutes. Rewatch: Section 9 – The clock."
    }
   ]
  }
 ]
}$draft$::jsonb);

  raise notice 'Created "SPRINT" as a draft. Open it in Admin → Courses to add the video.';
end;
$$;

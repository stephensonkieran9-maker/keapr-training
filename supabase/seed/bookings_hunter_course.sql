-- Keapr Training: "Keapr Bookings Hunter" course (draft).
-- Creates the course with 2 lessons and 20 quiz questions, taken word for
-- word from the quiz document. It is NOT published: upload each lesson's
-- video in the course builder (the length fills in automatically), check it
-- with Preview as learner, then Publish and assign.
-- Safe to re-run: does nothing if a course with this title already exists.

do $$
declare
  v_admin uuid;
begin
  select id into v_admin from public.profiles where role = 'admin' and is_active order by created_at limit 1;
  if v_admin is null then
    raise exception 'No active admin found.';
  end if;
  if exists (select 1 from public.courses where title = 'Keapr Bookings Hunter') then
    raise notice 'A course called "Keapr Bookings Hunter" already exists. Nothing to do.';
    return;
  end if;

  insert into public.courses (title, description, is_demo, created_by, draft)
  values ('Keapr Bookings Hunter', 'Onboarding for the Bookings Hunter role: two videos, each followed by a 10-question quiz.', false, v_admin, $draft${
 "lessons": [
  {
   "key": "bh-l1",
   "title": "Turn Missed Enquiries Into Money",
   "objectives": [],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 80,
   "requiredWatchPercent": 90,
   "isRequired": true,
   "estimatedMinutes": null,
   "hasQuiz": true,
   "questions": [
    {
     "key": "bh-l1-q1",
     "prompt": "What is your single objective in the Bookings Hunter role?",
     "options": [
      "Answer every guest message within the hour",
      "Turn \"we don't have a property\" enquiries into confirmed bookings by finding matches in our wider network",
      "Keep the Notion database tidy and up to date",
      "Sign up new owners to the management service"
     ],
     "correctIndex": 1,
     "explanation": "Most people would say \"sorry, we're full\". Your job is not to accept that — you hunt for options until the guest is placed or there is truly no way to place them."
    },
    {
     "key": "bh-l1-q2",
     "prompt": "Which three things does the Bookings Hunter sit between?",
     "options": [
      "Guests, cleaners and finance",
      "Airbnb, Booking.com and Hostaway",
      "Platforms that send enquiries, the internal Notion database, and the external network (WhatsApp groups, Facebook groups, partner owners/managers)",
      "Ops, marketing and the founders"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "bh-l1-q3",
     "prompt": "Which of these is NOT one of the three main numbers you'll be judged on?",
     "options": [
      "Recovered bookings / nights per week",
      "Speed to first response",
      "Volume of quality outreach",
      "Average nightly rate achieved"
     ],
     "correctIndex": 3,
     "explanation": "Keep recovered bookings, speed to first response and volume of quality outreach high and you'll win in this role."
    },
    {
     "key": "bh-l1-q4",
     "prompt": "Why does speed to first response matter so much?",
     "options": [
      "It keeps the Notion board tidy",
      "Faster response equals higher conversion",
      "Guests complain if they wait more than a day",
      "It lets you batch more enquiries together"
     ],
     "correctIndex": 1,
     "explanation": "The faster you respond once an enquiry hits the system, the more likely it converts."
    },
    {
     "key": "bh-l1-q5",
     "prompt": "In Step 1 (triage), what should you clarify with the guest?",
     "options": [
      "Dates, location, number of guests, budget, flexibility and any must-haves",
      "Name, email and card details",
      "Reason for travel and company registration number",
      "Just dates and location — the rest comes later"
     ],
     "correctIndex": 0,
     "explanation": "Respond quickly with a friendly message or voice note and get these details so nothing sits untouched and unclear."
    },
    {
     "key": "bh-l1-q6",
     "prompt": "In Step 2 (searching the internal database), what should you do if you find possible options?",
     "options": [
      "Wait until you have at least five before contacting anyone",
      "Send them all straight to the guest",
      "Move fast to confirm availability with the owner",
      "Post them in the WhatsApp group for feedback"
     ],
     "correctIndex": 2,
     "explanation": "Use filters (city, capacity, dates, contractor vs family), shortlist anything even close, then confirm availability with the owner quickly."
    },
    {
     "key": "bh-l1-q7",
     "prompt": "When you post a request in the external WhatsApp/Facebook groups, what should it include?",
     "options": [
      "Who, where, when, how many, and budget range",
      "The guest's full name and phone number",
      "A link to the guest's enquiry",
      "Our commission rate"
     ],
     "correctIndex": 0,
     "explanation": "A clear, concise request — and everything is tracked in Notion so we don't double-message or lose the thread."
    },
    {
     "key": "bh-l1-q8",
     "prompt": "Once you have 1–3 good options, how do you go back to the guest?",
     "options": [
      "Send the links and let them browse",
      "Summarise each option, recommend the best fit, and ask directly if they want to proceed",
      "Ask them to pick one and get back to you",
      "Hand it over to ops to close"
     ],
     "correctIndex": 1,
     "explanation": "You're not a \"tour guide\" — you help them decide and push the booking over the line."
    },
    {
     "key": "bh-l1-q9",
     "prompt": "What goes in the end-of-day summary?",
     "options": [
      "Hours worked and messages sent",
      "Number of new \"no match\" enquiries, number placed, and number still in progress (and why)",
      "A list of owners who didn't reply",
      "Total revenue recovered that day"
     ],
     "correctIndex": 1,
     "explanation": "Update Notion with what happened and make sure ops/finance have what they need — this is the boring work that actually makes money."
    },
    {
     "key": "bh-l1-q10",
     "prompt": "According to the video, what's the difference between average and great in this role?",
     "options": [
      "Average people answer messages; great people hunt until the booking is placed or it's truly impossible",
      "Average people work 9–5; great people work evenings",
      "Average people use Notion; great people use spreadsheets",
      "Average people send one message; great people send two"
     ],
     "correctIndex": 0,
     "explanation": "Great looks like moving fast (minutes, not hours), loving volume, following process, and treating a recovered booking as a personal win."
    }
   ]
  },
  {
   "key": "bh-l2",
   "title": "What Good Looks Like",
   "objectives": [],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 80,
   "requiredWatchPercent": 90,
   "isRequired": true,
   "estimatedMinutes": null,
   "hasQuiz": true,
   "questions": [
    {
     "key": "bh-l2-q1",
     "prompt": "A new enquiry comes in that we can't place directly. What does \"good\" look like in the first few minutes?",
     "options": [
      "Leave it until you've cleared your other tasks",
      "Open it, read it properly, and decide \"this is mine\" within minutes",
      "Forward it to a manager to assign",
      "Reply \"sorry, we're full\" and move on"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "bh-l2-q2",
     "prompt": "Why is speed to first contact treated as non-negotiable?",
     "options": [
      "Because managers track response times",
      "Because speed wins deals",
      "Because guests expect an auto-reply",
      "Because it keeps the inbox tidy"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "bh-l2-q3",
     "prompt": "Which fields should you fill in on the Notion record?",
     "options": [
      "Name, dates and budget",
      "Name, company (if any), dates, location, guests, budget, source and current status",
      "Guest phone number, property chosen and price agreed",
      "Whatever you have time for"
     ],
     "correctIndex": 1,
     "explanation": "Create or update the record immediately, with all eight fields."
    },
    {
     "key": "bh-l2-q4",
     "prompt": "How clear should your Notion notes be?",
     "options": [
      "Clear enough that you can remember them tomorrow",
      "Clear enough that anyone on the team could open the record and understand what's going on in 10 seconds",
      "Clear enough for the guest to read",
      "A one-word status is enough"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "bh-l2-q5",
     "prompt": "Complete the line from the video: \"If it's not in Notion...\"",
     "options": [
      "\"...it's probably in Hostaway\"",
      "\"...ask the team\"",
      "\"...it doesn't exist\"",
      "\"...add it at the end of the week\""
     ],
     "correctIndex": 2,
     "explanation": "Nothing stays \"in your head\"."
    },
    {
     "key": "bh-l2-q6",
     "prompt": "Which two tools do you use for the internal search?",
     "options": [
      "Airbnb and Booking.com",
      "Our Manus Search tool (internal database) and Hostaway",
      "PriceLabs and Google Sheets",
      "WhatsApp and Facebook groups"
     ],
     "correctIndex": 1,
     "explanation": "Search the internal database for suitable properties first, then check Hostaway for availability and conflicts."
    },
    {
     "key": "bh-l2-q7",
     "prompt": "When shortlisting realistic options, what three things are you matching on?",
     "options": [
      "Right area, capacity, and rough budget",
      "Star rating, photos, and reviews",
      "Owner responsiveness, cleaner availability, and parking",
      "Distance to the station, Wi-Fi speed, and pet policy"
     ],
     "correctIndex": 0,
     "explanation": "You do this fast, but you don't guess — you use the tools properly."
    },
    {
     "key": "bh-l2-q8",
     "prompt": "You've found a potential match. What's the first-choice way to contact the owner, and what if they don't pick up?",
     "options": [
      "Email first, then wait 24 hours",
      "WhatsApp first, then phone the next day",
      "Phone call first; if no answer, immediately follow with WhatsApp or a message",
      "Batch all owner contacts for the end of the day"
     ],
     "correctIndex": 2,
     "explanation": "You don't wait to batch it later — other people are chasing the same guest."
    },
    {
     "key": "bh-l2-q9",
     "prompt": "What must your message to the owner include?",
     "options": [
      "Who the guest is, dates, rate range, and what you need from the owner",
      "Our full terms and conditions",
      "The guest's contact details so they can liaise directly",
      "A list of all other properties you're considering"
     ],
     "correctIndex": 0,
     "explanation": ""
    },
    {
     "key": "bh-l2-q10",
     "prompt": "When you come back to the team with options, what do you state for each one — and how many options are you aiming for?",
     "options": [
      "Property/owner, dates they can do, price they'll accept, any special conditions — aiming for 2–3 solid options",
      "Property name and a listing link — aiming for one perfect option",
      "Owner's phone number and how fast they replied — aiming for as many as possible",
      "The guest's reaction and whether they've paid — aiming for 5+"
     ],
     "correctIndex": 0,
     "explanation": "You're racing the clock: \"How fast can I get back to the guest and my team with 2–3 solid options?\""
    }
   ]
  }
 ]
}$draft$::jsonb);

  raise notice 'Created "Keapr Bookings Hunter" as a draft. Open it in Admin → Courses to add the videos.';
end;
$$;

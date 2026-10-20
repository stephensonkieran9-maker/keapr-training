-- Keapr Training: adds lesson 3 "Where Your Leads Come From" to the
-- Keapr Bookings Hunter course draft (10 questions, word for word from the
-- quiz document). Lessons 1 and 2 are left exactly as they are.
-- Then upload the video in the course builder and publish again.
-- Safe to re-run: does nothing if the lesson is already in the draft.

do $$
declare
  v_course uuid;
  v_draft  jsonb;
begin
  select id, draft into v_course, v_draft from public.courses where title = 'Keapr Bookings Hunter' and archived_at is null;
  if v_course is null then
    raise exception 'Course "Keapr Bookings Hunter" not found. Run bookings_hunter_course.sql first.';
  end if;
  if jsonb_array_length(coalesce(v_draft->'lessons', '[]'::jsonb)) = 0 then
    raise exception 'The course draft is empty. Open the course in the builder once and click Save draft, then run this again.';
  end if;
  if exists (select 1 from jsonb_array_elements(v_draft->'lessons') l where l->>'title' = 'Where Your Leads Come From') then
    raise notice 'Lesson "Where Your Leads Come From" is already in the course. Nothing to do.';
    return;
  end if;

  update public.courses
  set draft = jsonb_set(v_draft, '{lessons}', (v_draft->'lessons') || jsonb_build_array($lesson${
 "key": "bh-l3",
 "title": "Where Your Leads Come From",
 "objectives": [
  "When an enquiry becomes your lead",
  "Where leads come from",
  "Recognising our partner sites",
  "Handling leads from existing guests and groups",
  "The one rule for every lead"
 ],
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
   "key": "bh-l3-q1",
   "prompt": "When does a platform enquiry become a lead for the Bookings Hunter?",
   "options": [
    "Every enquiry is a Bookings Hunter lead",
    "When we're full on those dates, have nothing in that area, or nothing the right size",
    "Only when the guest asks for a refund",
    "When the enquiry is over 28 nights"
   ],
   "correctIndex": 1,
   "explanation": "Most companies lose that enquiry right there. We don't — it becomes your lead to match with a property owner in the network."
  },
  {
   "key": "bh-l3-q2",
   "prompt": "According to the video, how many \"buckets\" do leads come from?",
   "options": [
    "Two",
    "Three",
    "Five",
    "Thirty-one"
   ],
   "correctIndex": 1,
   "explanation": "Booking platforms and partner sites; existing guests; and community groups (WhatsApp and Facebook)."
  },
  {
   "key": "bh-l3-q3",
   "prompt": "Which of these is NOT one of the three buckets?",
   "options": [
    "Booking platforms and partner sites",
    "Existing guests",
    "Cold-calling property owners",
    "WhatsApp and Facebook groups"
   ],
   "correctIndex": 2,
   "explanation": ""
  },
  {
   "key": "bh-l3-q4",
   "prompt": "Which group of sites is described as built for contractors and working crews?",
   "options": [
    "Booking.com, VRBO, Home to Go, Hopper",
    "Silverdoor, The Square, Blueground, Urban Stay",
    "Contractor Stop, Comfy Workers, Snooze for Staff, Stay for Work",
    "Flatio, Houfy, Spacest, Whimstay"
   ],
   "correctIndex": 2,
   "explanation": "Those enquiries are usually a team on a job, Monday to Friday, for weeks at a time — high value, and they come back."
  },
  {
   "key": "bh-l3-q5",
   "prompt": "What kind of enquiry typically comes from corporate and serviced-apartment agents like Silverdoor, The Square and Blueground?",
   "options": [
    "Families on a weekend break",
    "Companies placing their own staff, often on longer stays with a bigger budget",
    "Students looking for a term-time room",
    "Last-minute one-night stays"
   ],
   "correctIndex": 1,
   "explanation": ""
  },
  {
   "key": "bh-l3-q6",
   "prompt": "Why does the video say you must log the lead source correctly in Notion every time?",
   "options": [
    "So finance can invoice the platform",
    "Because the source tells us which channels are worth the most",
    "So we can block low-value platforms",
    "It's optional — only log it if you have time"
   ],
   "correctIndex": 1,
   "explanation": "You don't need to memorise which site is which type, but you must recognise the name, know it's one of ours, and record the source accurately."
  },
  {
   "key": "bh-l3-q7",
   "prompt": "An existing guest wants to extend but the property is booked after them. What's the right response?",
   "options": [
    "\"Sorry, it's not available\"",
    "Offer them a discount on their next stay",
    "\"Leave it with me\" — then find them somewhere else in the network for those dates, ideally close by",
    "Refer them to a hotel"
   ],
   "correctIndex": 2,
   "explanation": "The video calls existing guests the easiest money in the business — they already know us, trust us, and pay us."
  },
  {
   "key": "bh-l3-q8",
   "prompt": "A guest's project moves from one city to another and we have nothing in the new city. What does the video say?",
   "options": [
    "It's not our problem once they leave the area",
    "Pass it to ops to decline politely",
    "That doesn't matter — it's a lead, and you place it",
    "Tell them to book through the platform they found us on"
   ],
   "correctIndex": 2,
   "explanation": "They don't want to start again with a new provider — they want us to sort it."
  },
  {
   "key": "bh-l3-q9",
   "prompt": "Someone posts in a WhatsApp or Facebook group looking for accommodation. What does the video tell you to do?",
   "options": [
    "Ignore it — those groups are only for finding owners",
    "Reply publicly with our website link",
    "Move first: reply, take it to a direct message, qualify it, log it in Notion, then find a property",
    "Wait to see if another operator claims it"
   ],
   "correctIndex": 2,
   "explanation": "In the groups you're doing two jobs at once — hunting for owners to place our leads, and hunting for leads to place with our owners."
  },
  {
   "key": "bh-l3-q10",
   "prompt": "What's the one rule that applies whatever the source of the lead?",
   "options": [
    "Always ask for a deposit before searching",
    "The process is identical: log it with the source, respond fast, qualify it, search internal first then the network, and hunt until it's placed or truly impossible",
    "Platform leads get priority over guest leads",
    "Group leads are handled by ops, not the Bookings Hunter"
   ],
   "correctIndex": 1,
   "explanation": "The source changes where you look for the lead. It never changes what you do with it."
  }
 ]
}$lesson$::jsonb)),
      updated_at = now()
  where id = v_course;

  raise notice 'Added lesson %: "Where Your Leads Come From". Upload its video in the course builder, then publish.', jsonb_array_length(v_draft->'lessons') + 1;
end;
$$;

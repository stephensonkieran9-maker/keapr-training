-- Keapr Training: "Invoicing" course (draft), lesson 1 "Raising invoices".
-- 15 quiz questions word for word from the Red Steps Invoice Quiz (INV-0844):
-- 5 on the process, 10 maths. Pass mark 80% (12 of 15).
-- NOT published. In the course builder: upload the video, upload the invoice
-- PDF under Downloads (needs migration 0012), then Preview, Publish, assign.
-- Safe to re-run: does nothing if a course with this title already exists.

do $$
declare
  v_admin uuid;
begin
  select id into v_admin from public.profiles where role = 'admin' and is_active order by created_at limit 1;
  if v_admin is null then
    raise exception 'No active admin found.';
  end if;
  if exists (select 1 from public.courses where title = 'Invoicing') then
    raise notice 'A course called "Invoicing" already exists. Nothing to do.';
    return;
  end if;

  insert into public.courses (title, description, is_demo, created_by, draft)
  values ('Invoicing', 'How we raise, check and send invoices, with practice working out totals.', false, v_admin, $draft${
 "lessons": [
  {
   "key": "inv-l1",
   "title": "Raising invoices",
   "objectives": [
    "When invoices are sent",
    "Who checks an invoice before it goes out",
    "What you need before you start",
    "Working out totals from an invoice"
   ],
   "notes": "Download invoice INV-0844 using the button at the top and keep it open. You'll need it for the quiz.\n\nUse the figures on the invoice for the maths questions. The damage waiver is a one-off charge, not per night.",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 80,
   "requiredWatchPercent": 90,
   "isRequired": true,
   "estimatedMinutes": null,
   "hasQuiz": true,
   "downloads": [],
   "questions": [
    {
     "key": "inv-l1-q1",
     "prompt": "You've raised an invoice at 11am. When does it go to the client?",
     "options": [
      "Tomorrow morning, once it's been through accounts",
      "Today — same day it's raised",
      "Within 3 working days",
      "When the client asks for it"
     ],
     "correctIndex": 1,
     "explanation": "Raised today means sent today. Every day it sits is a day we're not paid."
    },
    {
     "key": "inv-l1-q2",
     "prompt": "Can you send an invoice to the client without anyone else seeing it?",
     "options": [
      "Yes, if it's a repeat client",
      "Yes, if it's under £500",
      "No — every invoice is checked by the bookings manager or office manager first, no exceptions",
      "Yes, if you've triple-checked it"
     ],
     "correctIndex": 2,
     "explanation": "Nothing goes to a client or guest unchecked. Your triple-check is not a substitute for the second pair of eyes."
    },
    {
     "key": "inv-l1-q3",
     "prompt": "Who decides which brand, which company and whether VAT applies?",
     "options": [
      "The agent, based on the client type",
      "The bookings manager, in writing, before you start",
      "The client",
      "Whoever is on shift"
     ],
     "correctIndex": 1,
     "explanation": "You get those three answers before you open a template. If you don't have them in writing, you don't start."
    },
    {
     "key": "inv-l1-q4",
     "prompt": "It's 20 minutes before the end of your shift and you've been asked to raise an invoice. What do you do?",
     "options": [
      "Build it and send it so it's done before you leave",
      "Leave it for tomorrow",
      "Message the bookings manager first so they're ready to check it, build it, get it checked, and send it before you leave — or flag it as built-and-unchecked if nobody can check it",
      "Send it and ask the bookings manager to check it tomorrow"
     ],
     "correctIndex": 2,
     "explanation": "Before-you-leave applies, but it never overrides the check. If it can't be checked, it waits and someone knows it exists."
    },
    {
     "key": "inv-l1-q5",
     "prompt": "Whose job is it to make sure the figures are right before the invoice is submitted for checking?",
     "options": [
      "The bookings manager's — that's what the check is for",
      "The agent's — triple-check before submitting; the bookings manager's check is the safety net",
      "The accountant's",
      "The client's — they'll query it if it's wrong"
     ],
     "correctIndex": 1,
     "explanation": "It's your invoice. An agent whose invoices keep coming back costs everyone time."
    },
    {
     "key": "inv-l1-q6",
     "prompt": "How many nights is the booking on the invoice?",
     "options": [
      "3",
      "4",
      "5",
      "30"
     ],
     "correctIndex": 1,
     "explanation": "Check-in 26 Oct, check-out 30 Oct = 26, 27, 28, 29 = 4 nights. The invoice confirms \"4 Nights\"."
    },
    {
     "key": "inv-l1-q7",
     "prompt": "What is the nightly accommodation rate?",
     "options": [
      "£94.15",
      "£79.40",
      "£105.87",
      "£63.52"
     ],
     "correctIndex": 1,
     "explanation": "£317.60 ÷ 4 nights = £79.40 per night. The damage waiver is not part of the nightly rate."
    },
    {
     "key": "inv-l1-q8",
     "prompt": "If the booking had been 7 nights at the same rate, with the damage waiver, what would the total due be?",
     "options": [
      "£555.80",
      "£614.80",
      "£694.20",
      "£376.60"
     ],
     "correctIndex": 1,
     "explanation": "7 × £79.40 = £555.80, plus £59.00 damage waiver = £614.80."
    },
    {
     "key": "inv-l1-q9",
     "prompt": "If the booking had been 28 nights at the same rate, with the damage waiver, what would the total due be?",
     "options": [
      "£2,223.20",
      "£2,282.20",
      "£2,341.20",
      "£2,202.80"
     ],
     "correctIndex": 1,
     "explanation": "28 × £79.40 = £2,223.20, plus £59.00 = £2,282.20. The waiver is charged once, not per night."
    },
    {
     "key": "inv-l1-q10",
     "prompt": "If the booking had been 60 nights at the same rate, with the damage waiver, what would the total due be?",
     "options": [
      "£4,764.00",
      "£4,823.00",
      "£4,705.00",
      "£5,649.00"
     ],
     "correctIndex": 1,
     "explanation": "60 × £79.40 = £4,764.00, plus £59.00 = £4,823.00. £5,649 is the trap — multiplying the whole invoice by 15 charges the damage waiver 15 times."
    },
    {
     "key": "inv-l1-q11",
     "prompt": "The guest wants to extend by 14 nights at the same rate and have one mid-stay clean at £100. What's the total of the extension invoice?",
     "options": [
      "£1,111.60",
      "£1,211.60",
      "£1,311.60",
      "£1,488.20"
     ],
     "correctIndex": 1,
     "explanation": "14 × £79.40 = £1,111.60, plus £100 clean = £1,211.60. No second damage waiver — it's already been charged on the original booking."
    },
    {
     "key": "inv-l1-q12",
     "prompt": "Following on from Q11: what has the client now paid in total across the original invoice and the extension?",
     "options": [
      "£1,488.20",
      "£1,588.20",
      "£1,211.60",
      "£1,647.20"
     ],
     "correctIndex": 1,
     "explanation": "£376.60 original + £1,211.60 extension = £1,588.20."
    },
    {
     "key": "inv-l1-q13",
     "prompt": "Instead of extending, the client asks you to add a £100 parking charge and one clean at £100 to the original booking. What's the revised total due?",
     "options": [
      "£476.60",
      "£576.60",
      "£676.60",
      "£535.60"
     ],
     "correctIndex": 1,
     "explanation": "£376.60 + £100 + £100 = £576.60."
    },
    {
     "key": "inv-l1-q14",
     "prompt": "The guest leaves one night early and the bookings manager agrees to refund that night. What's the revised total for the stay?",
     "options": [
      "£317.60",
      "£297.20",
      "£238.20",
      "£376.60"
     ],
     "correctIndex": 1,
     "explanation": "Refund one night at £79.40: £376.60 − £79.40 = £297.20. The damage waiver stays — it's per booking, not per night."
    },
    {
     "key": "inv-l1-q15",
     "prompt": "The client asks for the original invoice to be split 50/50 between two companies. What's the total on each invoice?",
     "options": [
      "£158.80",
      "£188.30",
      "£217.80",
      "£188.80"
     ],
     "correctIndex": 1,
     "explanation": "£376.60 ÷ 2 = £188.30 each. Split the whole invoice including the damage waiver, not just the accommodation."
    }
   ]
  }
 ]
}$draft$::jsonb);

  raise notice 'Created "Invoicing" as a draft. Open it in Admin → Courses to add the video and the invoice.';
end;
$$;

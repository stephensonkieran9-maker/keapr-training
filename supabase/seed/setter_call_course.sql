-- Keapr Training: "Setter Call Training" course (draft). Needs migration 0014 (reading lessons).
-- Lesson 1: the "Anatomy of a Pitch" video, 14-question quiz (pass 12).
-- Lesson 2: reading lesson, the Final Setter Script and Setter Objection
-- Sheet word for word, 20-question quiz (pass 16).
-- Questions come only from the video, the script and the objection sheet.
-- It is NOT published: upload the video to lesson 1 in the course builder
-- (the length fills in automatically), check with Preview as learner, then
-- Publish and assign.
-- Safe to re-run: does nothing if a course with this title already exists.

do $$
declare
  v_admin uuid;
begin
  select id into v_admin from public.profiles where role = 'admin' and is_active order by created_at limit 1;
  if v_admin is null then
    raise exception 'No active admin found.';
  end if;
  if exists (select 1 from public.courses where title = 'Setter Call Training') then
    raise notice 'A course called "Setter Call Training" already exists. Nothing to do.';
    return;
  end if;

  insert into public.courses (title, description, is_demo, created_by, draft)
  values ('Setter Call Training', 'For appointment setters: the Anatomy of a Pitch video, then the setter script and objection sheet as reading. Each lesson has a quiz.', false, v_admin, $draft${
 "lessons": [
  {
   "key": "sc-l1",
   "title": "Anatomy of a Pitch",
   "kind": "video",
   "readingBody": "",
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
     "key": "sc-l1-q1",
     "prompt": "What is the setter's one job on these calls?",
     "options": [
      "Sell Keapr's full management service",
      "Book a 20-minute planning call with the closer",
      "Quote the commission and payment terms",
      "Secure a first booking on the call"
     ],
     "correctIndex": 1,
     "explanation": "The one and only job of the setter is to book a 20-minute planning call with the closer."
    },
    {
     "key": "sc-l1-q2",
     "prompt": "Why is a 20-minute chat that ends with no booking counted as a loss?",
     "options": [
      "Because the owner will complain",
      "Because the setter has done the closer's job badly and lost the appointment",
      "Because long calls cost Keapr money",
      "Because the owner was probably not interested"
     ],
     "correctIndex": 1,
     "explanation": "The setter just tried to do the closer's job, did it badly, and lost the appointment."
    },
    {
     "key": "sc-l1-q3",
     "prompt": "How should the setter treat an objection?",
     "options": [
      "As a sign the owner is not interested",
      "As a predictable checkpoint",
      "As a debate to win",
      "As a reason to hand the call to the closer immediately"
     ],
     "correctIndex": 1,
     "explanation": "The script treats objections not as arguments to be won, but as highly predictable checkpoints."
    },
    {
     "key": "sc-l1-q4",
     "prompt": "Which of these is NOT one of the four rules the owner needs to hear?",
     "options": [
      "Nothing is instant book — everything is enquiry-only",
      "Every enquiry comes through Keapr first, no obligation",
      "Keapr guarantees a set number of bookings a year",
      "The owner sets the price every time"
     ],
     "correctIndex": 2,
     "explanation": "The four rules are enquiry-only, through Keapr first, the owner sets the price, and we decline if it doesn't fit."
    },
    {
     "key": "sc-l1-q5",
     "prompt": "What happens if the dates on an enquiry don't work for the owner?",
     "options": [
      "Keapr negotiates with the owner to move their other bookings",
      "Keapr declines it — no drama",
      "The owner is charged a cancellation fee",
      "The enquiry is held open for 48 hours"
     ],
     "correctIndex": 1,
     "explanation": "If it doesn't fit, we just decline it for you. No drama."
    },
    {
     "key": "sc-l1-q6",
     "prompt": "What example enquiry does the script use to show what a real enquiry sounds like?",
     "options": [
      "\"A couple want a weekend in March\"",
      "\"We've got a 72-night enquiry starting the 14th at about £950 a week — do you want it, yes or no?\"",
      "\"A contractor wants to move in indefinitely\"",
      "\"An insurer needs a property tonight\""
     ],
     "correctIndex": 1,
     "explanation": "Concrete numbers beat vague descriptions of a process."
    },
    {
     "key": "sc-l1-q7",
     "prompt": "What is the only thing the setter should say about Keapr's commission?",
     "options": [
      "It is 15%",
      "It is taken out of the owner's rate",
      "The owner gives their number and Keapr adds its commission on top for the client",
      "It depends on the owner's star rating"
     ],
     "correctIndex": 2,
     "explanation": "You give us your number, and we add our commission on top for the client."
    },
    {
     "key": "sc-l1-q8",
     "prompt": "Which of these is the setter allowed to quote?",
     "options": [
      "A commission percentage",
      "A number of days until payment",
      "A deposit amount",
      "None of the above"
     ],
     "correctIndex": 3,
     "explanation": "Never quote a percentage and never guess payment dates."
    },
    {
     "key": "sc-l1-q9",
     "prompt": "Why does the opener ask \"Is now a terrible time?\" instead of \"Is now a good time?\"",
     "options": [
      "It sounds more formal",
      "The easy answer is \"no\", which gives permission to carry on, and it sounds human",
      "It makes the owner feel guilty",
      "It is required by compliance"
     ],
     "correctIndex": 1,
     "explanation": "The lowest-friction answer is still \"no\", and that no gives you permission to proceed. It also sounds human."
    },
    {
     "key": "sc-l1-q10",
     "prompt": "How long is the planning call?",
     "options": [
      "5 minutes",
      "20 minutes",
      "45 minutes",
      "An hour"
     ],
     "correctIndex": 1,
     "explanation": "The setter books a 20-minute planning call with the closer."
    },
    {
     "key": "sc-l1-q11",
     "prompt": "How should the setter offer appointment times?",
     "options": [
      "\"When suits you?\"",
      "Two specific times, then \"what's easier?\"",
      "A link to a booking calendar",
      "Ask them to call back when free"
     ],
     "correctIndex": 1,
     "explanation": "\"Tuesday at 11 or Wednesday at 2, what's easier?\" Never ask \"when suits you\"."
    },
    {
     "key": "sc-l1-q12",
     "prompt": "What is the bridge line?",
     "options": [
      "\"Let me put you through to my manager\"",
      "\"That's exactly what [Closer Name] will run through with you properly on the planning call\"",
      "\"I'll send you a brochure\"",
      "\"Can I take your email?\""
     ],
     "correctIndex": 1,
     "explanation": "This is the golden bridge. It validates the question and hands the detail to the planning call."
    },
    {
     "key": "sc-l1-q13",
     "prompt": "The owner pushes for an exact commission percentage. The setter should:",
     "options": [
      "Quote 12%",
      "Quote a range",
      "Never quote a percentage — bridge to the closer",
      "Say it is confidential"
     ],
     "correctIndex": 2,
     "explanation": "The exact number depends on the client, and quoting it gives the owner something to argue about."
    },
    {
     "key": "sc-l1-q14",
     "prompt": "What is the target length of a setter call?",
     "options": [
      "Under 1 minute",
      "3 to 5 minutes",
      "10 to 15 minutes",
      "As long as the owner wants"
     ],
     "correctIndex": 1,
     "explanation": "The pitch is fast-paced, lasting just three to five minutes."
    }
   ],
   "downloads": []
  },
  {
   "key": "sc-l2",
   "title": "The Setter Script and Objection Sheet",
   "kind": "reading",
   "readingBody": "# Final Setter Script (Airbnb-only, long-stay network)\n\n# 1. Opener\n\n\"Hi, is this [First Name]?\nHey [Name], it's [Setter] calling from Keapr.\nYou asked to be added to our landlord database a while back.\nI'm working through a list of places that are mainly on Airbnb or Booking.com.\nIs now a terrible time?\"\n\n# 2. Context & interest check\n\n\"Perfect, I'll be quick.\nI'm looking at your place in [area/street].\nI just wanted to check: would you be interested in some more bookings, or at least some extra enquiries to look at?\"\n\nIf they say NO:\n\"Totally fine, I'll make a note of that and leave you be. If things change and you ever want a few more options, just let us know and we can look at it again.\"\n[End.]\n\nIf they say YES / MAYBE → continue.\n\n# 3. Simple qualification\n\n\"Great, that helps.\nJust so I don't waste your time:\nHow are bookings at the moment – mostly short stays and weekends, or are you pretty well covered midweek too?\nMost of what we see through this is contractor, corporate, and insurance bookings that are usually 28 nights or more. Would those kinds of longer stays be okay for you if the price and dates made sense?\"\n\nIf they say NO to long stays:\n\"Got it, thanks for being straight with me. In that case, this probably isn't the right fit for you right now, because this network is very geared toward 28-plus-night stays. I'll make a note and won't bother you with it.\"\n[End.]\n\nIf they say YES → continue.\n\n# 4. How it works (exclusive network + zero obligation)\n\n\"Let me quickly explain what we're doing and you can tell me if it even makes sense for you.\nWe sit in the middle of a bunch of channels that normal hosts don't touch – insurance databases, corporate and contractor platforms, and some closed networks that route bookings through partners like us rather than directly to hosts.\nA few key points so you're comfortable:\"\n\n- None of this is instant book. Everything is enquiry-only.\n- Every enquiry comes through us first. You're under no obligation to take anything.\n- You set the price each time. If it works for you, great. If it doesn't, we just say no and move on.\n- If the dates don't work, we decline it. No drama.\n\n\"So a typical one might be:\n'We've got a 72-night enquiry starting [date], at about £[X] a week. Do you want it, yes or no?'\nIf yes, we lock in a long booking. If no, nothing changes. There'll be plenty you say no to, and some that are a no-brainer.\"\n\n# 5. Planning-call close (golden bridge)\n\n\"Because we're selective with who we plug in, we do a quick planning call first.\nOn that call we look at:\"\n\n- Your current setup on Airbnb / Booking.com\n- What kind of 28-plus-night bookings would actually work for you\n- How we'd connect you into these enquiry-only channels while you stay in control on price\n\n\"Would you be open to a short 20-minute session to see what that could look like?\nWorst case, you decide you're happier as you are and we take you off the list.\nBest case, you pick up a few extra longer bookings a year, on your terms. Seems fair?\"\n\n\"I've got [Day, Time A] or [Day, Time B] – what's easier?\"\n\n# 6. If they ask \"What's the catch / am I tied in?\"\n\n\"Totally fair question. There's no tie-in and no instant bookings.\nIf at any point you don't like it, we just stop sending enquiries and remove you from that network. Simple as that.\"\n\n# Setter Objection Sheet (for long-stay network calls)\n\nRule:\nAnswer in 1–2 calm sentences, then move back to:\n\"That's exactly what [Closer Name] will run through with you properly on the planning call.\"\n\n# 1. \"Do you charge to onboard?\"\n\n\"Good question. No, there's no onboarding fee to be in the network.\nYou only make a decision when we bring you an actual booking you want.\"\n\n# 2. \"How much do you charge / what's your cut?\"\n\n\"So we don't charge you to join. When an enquiry comes in it's either:\n'They want to pay £150 a night for 61 nights, does that work for you, yes or no?'\nOr we ask you, 'What do you need for this stay?' and if you say '£145 a night for 72 nights,' we just add our commission on top of that.\nSo you get your number, and we make our bit on top.\"\n(If they push): \"The detail of that is what [Closer Name] will walk you through on the call, with real examples.\"\n\n# 3. \"When will I get paid?\"\n\n\"Each insurance and corporate client has different payment schedules.\nOn the planning call, [Closer Name] will show you the typical timelines and how it works for each type, so you know roughly when money hits your account before you say yes to anything.\"\n\n# 4. \"Are you speaking to others / do I have to be the cheapest?\"\n\n\"Sometimes, yes, we'll be talking to 3–4 suitable places at once.\nWe're not asking you to be the cheapest, just reasonable. If your price is way above what you already get on Airbnb or Booking.com, the contractors will just laugh and go elsewhere.\nAs long as it's sensible for the stay and the area, that's fine.\"\n\n# 5. \"Am I tied in? Is there a contract?\"\n\n\"There's no long tie-in for this. You're not obliged to take any bookings.\nIf at any point you don't like it, we stop sending enquiries and take you off the list. Simple as that.\"\n\n# 6. \"Do I have to accept every booking you send?\"\n\n\"Not at all. Every enquiry is optional.\nWe'll bring you the dates, length, and rate and you just decide: yes or no.\nIf it doesn't work for you, we decline and move on to the next one.\"\n\n# 7. \"Do I lose control of pricing?\"\n\n\"No, you always control your number.\nWe'll either say, 'They're offering X, does that work?' or 'What do you need for this?'\nIf it doesn't stack for you, we don't do it.\"\n\n# 8. \"What about damages / parties / idiots in my house?\"\n\n\"We're mostly placing contractors, insurance, and corporate stays, not hen parties.\nFor extra peace of mind, we can take a security deposit against damages and we know exactly who is supposed to be in the property.\n[Closer Name] will go through how that's handled in practice on the call.\"\n\n# 9. \"Will this mess with my Airbnb / Booking.com account?\"\n\n\"No, your existing listings stay as they are.\nThese enquiries come through our channels and we manage them separately in the background. You still control your Airbnb/Booking.com the way you do now.\"\n\n# 10. \"Can I still use the property myself or for my own bookings?\"\n\n\"Yes. You still block dates on your side whenever you want to use it or have your own bookings.\nIf it's not available for something we bring you, we just decline it.\"\n\n# 11. \"Why can't you just send me info? Why a call?\"\n\n\"Totally fair. The thing is, every property and owner is different – area, bills, what you're happy with.\nMy job is just to see if it's even worth you speaking with [Closer Name]. He's the one who can actually look at your place properly and run numbers with you.\n\n# 12. \"Is there any upfront cost at all?\"\n\n\"There's no upfront fee to be in the network and no charge just to have the call.\nYou only ever commit if a booking and a price make sense for you.\"\n\n# How to use this with your setter\n\nPrint it and keep it next to the script.\nFirst week: roleplay every one of these objections daily for 15 minutes.\nRule: answer once, then always finish with \"That's exactly what [Closer Name] will run through with you properly on the planning call,\" and go back to booking the time.\nYou do that for 10 working days, he'll stop fearing objections and just see them as checkpoints before handing them to you.",
   "objectives": [],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 80,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 15,
   "hasQuiz": true,
   "questions": [
    {
     "key": "sc-l2-q1",
     "prompt": "Who is on the list the setter is calling?",
     "options": [
      "Random Airbnb hosts scraped from the internet",
      "Owners already managed by Keapr",
      "Owners who asked to be added to Keapr's landlord database",
      "Estate agents and letting agents"
     ],
     "correctIndex": 2,
     "explanation": "\"You asked to be added to our landlord database a while back.\""
    },
    {
     "key": "sc-l2-q2",
     "prompt": "Which platforms are most of these owners on?",
     "options": [
      "Direct booking websites only",
      "Mainly Airbnb or Booking.com",
      "Corporate housing platforms",
      "Insurance databases"
     ],
     "correctIndex": 1,
     "explanation": "\"I'm working through a list of places that are mainly on Airbnb or Booking.com.\""
    },
    {
     "key": "sc-l2-q3",
     "prompt": "What is the minimum length of a stay that comes through the network?",
     "options": [
      "7 nights",
      "14 nights",
      "28 nights",
      "90 nights"
     ],
     "correctIndex": 2,
     "explanation": "Bookings are \"usually 28 nights or more\", and the network is \"very geared toward 28-plus-night stays\"."
    },
    {
     "key": "sc-l2-q4",
     "prompt": "What types of bookings come through the network?",
     "options": [
      "Weekend leisure and hen parties",
      "Students and long-term tenants",
      "Contractor, corporate and insurance stays",
      "Holiday lets in summer only"
     ],
     "correctIndex": 2,
     "explanation": "\"Most of what we see through this is contractor, corporate, and insurance bookings.\""
    },
    {
     "key": "sc-l2-q5",
     "prompt": "The owner says a clean \"no\" at the interest check. What does the setter do?",
     "options": [
      "Try a second angle",
      "Ask why",
      "Say that's fine, make a note, tell them to let us know if things change, and end the call",
      "Offer a discount"
     ],
     "correctIndex": 2,
     "explanation": "\"Totally fine, I'll make a note of that and leave you be. If things change… just let us know.\""
    },
    {
     "key": "sc-l2-q6",
     "prompt": "What does the qualification step check?",
     "options": [
      "Whether the property has parking",
      "Whether longer stays of 28-plus nights would be okay if the price and dates made sense",
      "Whether the owner has five-star reviews",
      "Whether the owner has been hosting for over a year"
     ],
     "correctIndex": 1,
     "explanation": "\"Would those kinds of longer stays be okay for you if the price and dates made sense?\""
    },
    {
     "key": "sc-l2-q7",
     "prompt": "How does the setter finish the 72-night example?",
     "options": [
      "\"You'll be fully booked within a month\"",
      "\"There'll be plenty you say no to, and some that are a no-brainer\"",
      "\"Most owners take every enquiry\"",
      "\"The closer picks which ones you take\""
     ],
     "correctIndex": 1,
     "explanation": "\"If yes, we lock in a long booking. If no, nothing changes. There'll be plenty you say no to, and some that are a no-brainer.\""
    },
    {
     "key": "sc-l2-q8",
     "prompt": "What reason does the setter give for doing a planning call first?",
     "options": [
      "\"Because we're selective with who we plug in\"",
      "Because it's a legal requirement",
      "Because the closer has to inspect the property",
      "Because the setter isn't trained on pricing"
     ],
     "correctIndex": 0,
     "explanation": "\"Because we're selective with who we plug in, we do a quick planning call first.\""
    },
    {
     "key": "sc-l2-q9",
     "prompt": "What is the rule for answering an objection?",
     "options": [
      "Answer every objection with one word",
      "Answer once in one or two calm sentences, then bridge back to the planning call",
      "Only answer one objection per call",
      "Let the owner answer their own question"
     ],
     "correctIndex": 1,
     "explanation": "\"Answer in 1–2 calm sentences, then move back to: 'That's exactly what [Closer Name] will run through with you properly on the planning call.'\""
    },
    {
     "key": "sc-l2-q10",
     "prompt": "The owner asks \"Do you charge to onboard?\" The setter says:",
     "options": [
      "\"Yes, a small set-up fee\"",
      "\"No onboarding fee. You only make a decision when we bring you an actual booking you want\"",
      "\"It depends on the property\"",
      "\"Let me explain the full commission structure\""
     ],
     "correctIndex": 1,
     "explanation": "Objection 1 on the sheet."
    },
    {
     "key": "sc-l2-q11",
     "prompt": "The owner asks \"When will I get paid?\" The right answer is:",
     "options": [
      "\"30 days\"",
      "\"Each client has different schedules; on the planning call [Closer Name] shows the typical timelines so you know before you say yes to anything\"",
      "\"Same day\"",
      "\"Whenever the contractor pays us\""
     ],
     "correctIndex": 1,
     "explanation": "Objection 3 on the sheet."
    },
    {
     "key": "sc-l2-q12",
     "prompt": "The owner asks \"Do I have to be the cheapest?\" The setter says:",
     "options": [
      "\"Yes, cheapest wins\"",
      "\"No, just reasonable for the stay and the area — and yes, sometimes we're talking to three or four places at once\"",
      "\"You're the only one we're calling\"",
      "\"Price doesn't matter\""
     ],
     "correctIndex": 1,
     "explanation": "Objection 4 on the sheet."
    },
    {
     "key": "sc-l2-q13",
     "prompt": "What benchmark does the setter use for a \"reasonable\" price?",
     "options": [
      "Local hotel rates",
      "What the owner already gets on Airbnb or Booking.com",
      "The council tax band",
      "Keapr's own managed properties"
     ],
     "correctIndex": 1,
     "explanation": "\"If your price is way above what you already get on Airbnb or Booking.com, the contractors will just laugh and go elsewhere.\""
    },
    {
     "key": "sc-l2-q14",
     "prompt": "The owner asks \"Am I tied in? Is there a contract?\" The setter says:",
     "options": [
      "\"Six-month minimum\"",
      "\"No long tie-in, no obligation to take bookings; if you don't like it we stop sending enquiries and take you off the list\"",
      "\"Twelve-month rolling\"",
      "\"I'll have to check\""
     ],
     "correctIndex": 1,
     "explanation": "Objection 5 on the sheet."
    },
    {
     "key": "sc-l2-q15",
     "prompt": "The owner asks \"Do I lose control of pricing?\" Which line should the setter keep?",
     "options": [
      "\"We'll set a competitive rate for you\"",
      "\"If it doesn't stack for you, we don't do it\"",
      "\"Our pricing software decides\"",
      "\"The contractor sets the price\""
     ],
     "correctIndex": 1,
     "explanation": "\"No, you always control your number… If it doesn't stack for you, we don't do it.\""
    },
    {
     "key": "sc-l2-q16",
     "prompt": "On the damages objection, which three reassurances does the setter give?",
     "options": [
      "Insurance covers everything, we pay for cleaning, we visit weekly",
      "Mostly contractors and corporate, not hen parties; a security deposit can be taken; we know exactly who is in the property",
      "Guests are vetted by Airbnb, we have a 24/7 line, nothing ever goes wrong",
      "The closer handles it, don't worry, it's rare"
     ],
     "correctIndex": 1,
     "explanation": "Objection 8 on the sheet."
    },
    {
     "key": "sc-l2-q17",
     "prompt": "The owner asks \"Will this mess with my Airbnb account?\" The setter says:",
     "options": [
      "\"We'll need your login\"",
      "\"No — your listings stay as they are; these enquiries come through our channels and we manage them separately in the background\"",
      "\"We'll pause your Airbnb while we send enquiries\"",
      "\"Airbnb will be notified\""
     ],
     "correctIndex": 1,
     "explanation": "Objection 9 on the sheet."
    },
    {
     "key": "sc-l2-q18",
     "prompt": "The owner asks \"Can I still use the property myself?\" The setter says:",
     "options": [
      "\"Only with 30 days' notice\"",
      "\"Yes — block dates on your side as normal; if it's not available for something we bring you, we just decline it\"",
      "\"No, the network needs full availability\"",
      "\"You'll need to ask the closer\""
     ],
     "correctIndex": 1,
     "explanation": "Objection 10 on the sheet."
    },
    {
     "key": "sc-l2-q19",
     "prompt": "Which of these is the setter allowed to say?",
     "options": [
      "\"Guaranteed bookings\"",
      "\"Someone will give you a call\", with no time booked",
      "\"There'll be plenty you say no to, and some that are a no-brainer\"",
      "\"Our commission is 15%\""
     ],
     "correctIndex": 2,
     "explanation": "This line is in the \"how it works\" section of the script."
    },
    {
     "key": "sc-l2-q20",
     "prompt": "What is the roleplay drill plan for a new setter?",
     "options": [
      "One two-hour session on day one",
      "15 minutes a day, every day, for 10 working days",
      "Once a week for a month",
      "Only after the first live call goes wrong"
     ],
     "correctIndex": 1,
     "explanation": "\"Roleplay every one of these objections daily for 15 minutes… for 10 working days.\""
    }
   ],
   "downloads": []
  }
 ]
}$draft$::jsonb);

  raise notice 'Created "Setter Call Training" as a draft. Upload the lesson 1 video, preview, then publish.';
end $$;

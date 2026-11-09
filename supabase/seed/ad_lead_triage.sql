-- Keapr Training: "Ad-Lead Triage" course (draft).
-- Needs migrations 0014 (reading lessons) and 0016 (task lessons).
-- Built from the Ad-Lead Triage Script, the Management Objections & 2-Day
-- Training Plan, the Setter Comp sheet, the 48-Hour Sales Training video and
-- the Day 1 / Day 2 quizzes (questions word for word, pass mark 27/30 = 90%).
--   Day 1  1. Training video          2. Read script + objections (task)
--          3. Your pay (reading)      4. Script Reps (task)
--          5. Day 1 Quiz (30 q)       6. Required Recording (task)
--   Day 2  7. Objection Self-Practice 8. Walkthrough + Hand-Writing
--          9. No-Paper Drill          10. Hard Landlord Role-Play
--          11. Live Calls With Spot-Coaching  12. Lock-In Quiz (all tasks)
--          13. Day 2 Quiz (30 q)
-- Real Call Injection from the plan is left out.
-- Day 2 quiz questions 26 and 28–30 name the drills by their Day 2 lesson
-- (the plan had them as Day 1 blocks); everything else is word for word.
-- Not published: upload the video to lesson 1, the Day 1 PDF to lesson 2 and
-- the Day 2 PDF to lesson 7 (Downloads), preview, then Publish and assign.
-- Safe to re-run: if the course exists its draft is replaced, keeping the
-- uploaded video. Downloads need uploading again.

do $$
declare
  v_admin uuid;
  v_course uuid;
  v_old jsonb;
  v_new jsonb := $draft${
 "lessons": [
  {
   "key": "alt-video",
   "title": "Day 1 · Training Video: Keapr 48-Hour Sales Training",
   "kind": "video",
   "isTask": false,
   "readingBody": "",
   "objectives": [
    "Your job on these calls: find out if they want a bit more bookings or more hands-off management, then send the Hybrid link or book a management call. No third option.",
    "The two questions that decide the call: are they hosting, and A (extra bookings) or B (more hands-off)",
    "How to answer the 10 management questions, then point them back to the planning call"
   ],
   "notes": "Watch the training video once all the way through. The next lessons take you through the script, your pay and the objections.",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 90,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": null,
   "hasQuiz": false,
   "questions": [],
   "downloads": []
  },
  {
   "key": "alt-read",
   "title": "Day 1 · Read the Triage Script and Management Objections",
   "kind": "reading",
   "isTask": true,
   "readingBody": "# Day 1 · Read the Script\n\n- Read the Keapr Ad-Lead Triage Script once, top to bottom.\n- Read the Management Objections & Answers once, top to bottom.\n\nBoth are in the Day 1 PDF under Downloads. The Day 1 quiz covers the script and all 10 objections.",
   "objectives": [
    "Read the full triage script once, top to bottom",
    "Read the 10 management objections and answers once, top to bottom"
   ],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 90,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 20,
   "hasQuiz": false,
   "questions": [],
   "downloads": []
  },
  {
   "key": "alt-pay",
   "title": "Day 1 · Your Pay & What Counts As A Qualified Management Show",
   "kind": "reading",
   "isTask": false,
   "readingBody": "# Your pay has 3 parts\n\n# 1. Base pay\n\n- You earn $6 per hour for your time on shift. This is for showing up and doing the work.\n\n# 2. Show bonus (qualified management calls only)\n\n- You earn $3 for every qualified management planning call that actually shows.\n- \"Shows\" means the prospect turns up and stays on the call for at least 10 minutes.\n\n# 3. Onboarding bonus (cash collected)\n\n- You earn $35 for every management client who pays the £495 onboarding fee that came from a call you set.\n- This is where the real upside is for you.\n\n# What \"Qualified Management Show\" Means\n\nYou ONLY get the $3 show bonus if all of these are true:\n\n1. They are (or will be) hosting: they are already hosting now on Airbnb/Booking.com/etc, or they will be live within the next 60 days.\n2. They want it more hands-off (management): on Question 2, they clearly chose the hands-off / management option (B), or said their biggest problem is the time and hassle of running it, not just \"a few extra bookings.\"\n3. They are a service fit: the property is in an area we actually want to work in. The property type and expected rates are sensible (not something we would obviously never take on).\n4. The call actually happens: the prospect attends the planning call you booked and stays at least 10 minutes.\n\nIf any of these points are missing, that call does not count as a qualified management show, and there is no $3 show bonus for that one. You still earn your hourly pay, and you still earn $35 if they end up paying the £495 onboarding fee.\n\n# Why This Matters\n\n- Stuffing the calendar with low-quality or wrong-fit calls does not help you or the company.\n- You make the most money when you book real management prospects who show up, and those prospects become paying management clients.\n\n# Summary\n\n\"You get $6/hr base, $3 for every qualified management call that shows, and $35 for every management client who pays the £495 onboarding fee from your calls. Focus on quality, not just volume.\"",
   "objectives": [
    "Your pay has 3 parts: base pay, show bonus and onboarding bonus",
    "The four things that make a call a qualified management show",
    "Focus on quality, not just volume"
   ],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 90,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 10,
   "hasQuiz": false,
   "questions": [],
   "downloads": []
  },
  {
   "key": "alt-reps",
   "title": "Day 1 · Script Reps",
   "kind": "reading",
   "isTask": true,
   "readingBody": "# Day 1 · Script Reps\n\nRead the full triage script (sections 0–6) out loud 5 times.\n\nThen focus on:\n\n- Section 1 (Opener + \"Is now a terrible time for a quick 2–3 minute call?\") – out loud 5 more times.\n- Sections 2–3 (Question 1: are they hosting? + Question 2: A vs B, and \"If you had to choose, what annoys you more right now…\") – out loud 5 more times.\n- Section 5 (Branch B: repeat and lock → commitment question → edify the closer → confirm contact + reminders) – out loud 5 more times.",
   "objectives": [
    "Read the full script (sections 0–6) out loud 5 times",
    "Then focus on the opener, Questions 1–2 and the Branch B lock-in, out loud 5 more times each"
   ],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 90,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 60,
   "hasQuiz": false,
   "questions": [],
   "downloads": []
  },
  {
   "key": "alt-quiz1",
   "title": "Day 1 · Quiz",
   "kind": "reading",
   "isTask": false,
   "readingBody": "# Day 1 · Quiz\n\nDay 1 is a recall test: 30 questions on the triage script (Part A) and the 10 management objections (Part B). You sit it at the end of Day 1, closed book, in one go. Pass mark is 27/30 – anything you miss goes back into the drill the next morning before live calls.\n\n- Part A – The triage script (questions 1–22)\n- Part B – Management objections (questions 23–30)\n\nOne correct answer per question.",
   "objectives": [
    "Take the 30-question Day 1 quiz. Pass mark: 27/30"
   ],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 90,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 30,
   "hasQuiz": true,
   "questions": [
    {
     "key": "alt-d1-q1",
     "prompt": "What is Reed's job on an ad-lead triage call?",
     "options": [
      "Sell full management to every lead who answers",
      "Quickly work out whether they want a few more bookings or a more hands-off setup, then send the Hybrid link or book a management call",
      "Collect as much detail about the property as possible for the closer",
      "Give the lead rough income projections so they can decide"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d1-q2",
     "prompt": "How many possible outcomes does a triage call have?",
     "options": [
      "One – every lead gets a management call",
      "Three – Hybrid, management, or a follow-up call",
      "Two – Hybrid link sent, or management call booked. No third option",
      "As many as the lead needs"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "alt-d1-q3",
     "prompt": "In the opener, how long does Reed say the call will take?",
     "options": [
      "5 minutes",
      "2–3 minutes",
      "10 minutes",
      "20 minutes"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d1-q4",
     "prompt": "What is the exact phrasing used to check timing?",
     "options": [
      "\"Have you got a few minutes?\"",
      "\"Is now a good time to talk?\"",
      "\"Can I grab 5 minutes of your time?\"",
      "\"Is now a terrible time for a quick 2–3 minute call?\""
     ],
     "correctIndex": 3,
     "explanation": ""
    },
    {
     "key": "alt-d1-q5",
     "prompt": "How does Reed introduce the reason for the call?",
     "options": [
      "\"You registered with us recently about getting help with your place\"",
      "\"I'm calling about your Airbnb listing performance\"",
      "\"I'm a sales rep from Keapr and I'd like to pitch our services\"",
      "\"We've been looking at properties in your area\""
     ],
     "correctIndex": 0,
     "explanation": ""
    },
    {
     "key": "alt-d1-q6",
     "prompt": "The lead says \"I'm busy but go ahead.\" What does Reed do?",
     "options": [
      "Offer to call back at a better time",
      "Continue the call, a bit faster",
      "Skip straight to asking for their email",
      "End the call and send the Hybrid link anyway"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d1-q7",
     "prompt": "It is a genuinely bad time. How does Reed offer a callback?",
     "options": [
      "\"When suits you? I'm flexible\"",
      "\"I'll email you a calendar link\"",
      "\"I've got [Day] at [Time A] or [Day] at [Time B] – what's easier?\"",
      "\"Call us back whenever you're free\""
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "alt-d1-q8",
     "prompt": "How long a call does Reed propose for that callback?",
     "options": [
      "2–3 minutes",
      "20 minutes",
      "10 minutes",
      "5 minutes"
     ],
     "correctIndex": 3,
     "explanation": ""
    },
    {
     "key": "alt-d1-q9",
     "prompt": "Once the callback is booked, what does Reed do?",
     "options": [
      "Repeat the time back and stop there",
      "Quickly run through Question 1 while he has them",
      "Send the Hybrid link so they can watch it before the call",
      "Ask Question 2 so he can tag them before the callback"
     ],
     "correctIndex": 0,
     "explanation": ""
    },
    {
     "key": "alt-d1-q10",
     "prompt": "What is Question 1 of the script about?",
     "options": [
      "How many bedrooms the property has",
      "Whether they're already hosting on Airbnb or Booking.com, or still getting set up",
      "What they're currently earning per month",
      "Whether they've used a management company before"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d1-q11",
     "prompt": "The lead has no listing live yet. What does Reed do?",
     "options": [
      "Book a management call – pre-launch owners need the most help",
      "Send the Hybrid link so they're ready when they go live",
      "Tag as pre-launch, confirm their best email, and end the call",
      "Ask Question 2 anyway to see which bucket they fit"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "alt-d1-q12",
     "prompt": "Why does Reed tell a pre-launch lead that Keapr's help \"kicks in once the place is live\"?",
     "options": [
      "Because Keapr doesn't take on new properties until they're trading",
      "Because what Keapr does – more bookings or more hands-off – needs a live listing to work on",
      "Because pre-launch leads rarely convert",
      "Because insurance channels won't cover an unlisted property"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d1-q13",
     "prompt": "After confirming the lead is already hosting, what does Reed ask next?",
     "options": [
      "The full address and postcode",
      "The number of bedrooms and sleeps",
      "Roughly where the property is – just the town",
      "The nightly rate they're charging"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "alt-d1-q14",
     "prompt": "Question 2 is described as \"the big one.\" What are the two options?",
     "options": [
      "Airbnb-only vs. all platforms",
      "14% vs. 17% management",
      "A) a few extra bookings on top of what they're getting, or B) Keapr taking over more of the work and making it hands-off",
      "Hybrid now vs. management later"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "alt-d1-q15",
     "prompt": "In option B, which channels does Reed say Keapr adds?",
     "options": [
      "Social media and Google Ads",
      "All the main sites plus Keapr's contractor and insurance channels",
      "Airbnb and Booking.com only",
      "Local estate agents and relocation firms"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d1-q16",
     "prompt": "The lead says \"both, really – not sure.\" What is Reed's follow-up?",
     "options": [
      "\"Shall I send you both options and you can decide?\"",
      "\"What's your budget for management?\"",
      "\"If you had to choose, what annoys you more: not having enough good bookings, or spending time dealing with guests, cleaners, messages, all of that?\"",
      "\"Let's book a call and the closer can work it out\""
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "alt-d1-q17",
     "prompt": "The lead answers \"honestly, the hassle and the time.\" Which branch?",
     "options": [
      "Branch A – Hybrid",
      "Branch B – Management",
      "Pre-launch",
      "Hard no"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d1-q18",
     "prompt": "What is the key selling point of Hybrid?",
     "options": [
      "Keapr takes over everything for a lower fee",
      "Income is guaranteed for the first 6 months",
      "The owner keeps full control and Keapr plugs them into extra demand streams so they can pick and choose extra bookings",
      "No onboarding fee"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "alt-d1-q19",
     "prompt": "How is the Hybrid link delivered, and what does Reed confirm before sending?",
     "options": [
      "By text and email; best email and mobile (repeating the last four digits)",
      "By WhatsApp only; their property address",
      "By email only; their Airbnb listing URL",
      "Read out over the phone; nothing to confirm"
     ],
     "correctIndex": 0,
     "explanation": ""
    },
    {
     "key": "alt-d1-q20",
     "prompt": "What tag goes on a Hybrid lead at the end of the call?",
     "options": [
      "MGMT-INTEREST – CALL BOOKED",
      "HYBRID-INTEREST – LINK SENT",
      "PRE-LAUNCH – EMAIL CONFIRMED",
      "HYBRID – FOLLOW UP"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d1-q21",
     "prompt": "In Branch B, what is the next step Reed offers?",
     "options": [
      "A site visit from the closer",
      "A contract sent by email",
      "A quick 20-minute planning call with the closer to look at the property, the numbers and what hands-off would look like",
      "A 5-minute call with Reed next week"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "alt-d1-q22",
     "prompt": "The lead picks a slot. What is the correct order of what Reed does next?",
     "options": [
      "Edify the closer → commitment question → repeat and lock → confirm contact and reminders",
      "Repeat and lock the time → commitment question → edify the closer → confirm contact and reminders",
      "Confirm contact → repeat and lock → edify the closer → commitment question",
      "Commitment question → repeat and lock → confirm contact → edify the closer"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d1-q23",
     "prompt": "\"How much do you charge?\" – what is the full management fee range?",
     "options": [
      "10–12% of booking revenue",
      "18–20% of booking revenue",
      "14–17% of booking revenue, depending on the level of service",
      "A fixed £295 a month"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "alt-d1-q24",
     "prompt": "What is included in full management, as Reed describes it?",
     "options": [
      "Guest communication, pricing, calendar management, cleaner coordination, and getting onto all the main sites plus contractor and insurance channels",
      "Guest communication and cleaning only",
      "Listing photos and a welcome pack",
      "Everything except pricing, which the owner sets"
     ],
     "correctIndex": 0,
     "explanation": ""
    },
    {
     "key": "alt-d1-q25",
     "prompt": "Who pays for the cleaning?",
     "options": [
      "The owner, deducted from the monthly payout",
      "Keapr, out of the management fee",
      "The guest, through a cleaning fee",
      "It's split between owner and Keapr"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "alt-d1-q26",
     "prompt": "What is the onboarding fee and what does it cover?",
     "options": [
      "£295 – photos only",
      "£495 – listings, photos where needed, pricing, and connecting into all the channels",
      "£995 – a full furniture and compliance audit",
      "There is no onboarding fee"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d1-q27",
     "prompt": "What is the minimum contract length and notice period?",
     "options": [
      "12-month agreement, 1-month notice",
      "Rolling monthly, 30 days' notice",
      "3-month agreement, no notice",
      "6-month agreement, 2-month notice"
     ],
     "correctIndex": 3,
     "explanation": ""
    },
    {
     "key": "alt-d1-q28",
     "prompt": "The lead asks for projections on the triage call. What does Reed offer?",
     "options": [
      "A rough monthly figure based on the town",
      "A short form to fill in now, so the closer can get to the numbers faster on the planning call",
      "A link to Keapr's average occupancy data",
      "Nothing – projections aren't something Keapr provides"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d1-q29",
     "prompt": "\"Do you guarantee income / is it rent-to-rent?\" – correct answer?",
     "options": [
      "Yes, Keapr can guarantee a fixed monthly rent",
      "No – it's a percentage of revenue, so Keapr only makes more when the owner makes more",
      "Yes, but only after the first 6 months",
      "Only on properties in major cities"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d1-q30",
     "prompt": "\"Will I lose my existing Airbnb / Booking.com setup?\"",
     "options": [
      "Yes – Keapr creates fresh listings under its own account",
      "Yes, but the reviews transfer across",
      "No – the owner still owns the listings; Keapr optimises them or rebuilds them properly under management",
      "Only the Booking.com listing is replaced"
     ],
     "correctIndex": 2,
     "explanation": ""
    }
   ],
   "downloads": []
  },
  {
   "key": "alt-record",
   "title": "Day 1 · Required Recording: The Triage Script",
   "kind": "reading",
   "isTask": true,
   "readingBody": "# Day 1 · Required Recording (Send by end of Day 1)\n\nRecord and send two videos (phone is fine):\n\n# 1. Hybrid Route\n\nYou reading the script word-for-word, start to finish: Opener → Question 1 → Question 2 → Branch A (Hybrid link, confirm email + mobile, set expectation).\n\n# 2. Management Route\n\nYou reading the script word-for-word, start to finish: Opener → Question 1 → Question 2 → Branch B (planning call with [Closer name], repeat and lock, commitment question, edify the closer, confirm contact + reminders).",
   "objectives": [
    "Record yourself running the full triage script, both routes, and send it in"
   ],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 90,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 30,
   "hasQuiz": false,
   "questions": [],
   "downloads": []
  },
  {
   "key": "alt-objreps",
   "title": "Day 2 · Objection Self-Practice",
   "kind": "reading",
   "isTask": true,
   "readingBody": "# Day 2 · Objection Self-Practice\n\nYour job on management questions is simple: answer clearly, don't waffle, then point them back to the planning call.\n\nThe answers are in your Day 1 PDF. Today's plan is in the Day 2 PDF under Downloads.\n\nFor each of the 10 objections below, say the answer from the sheet out loud 5 times. Finish every answer with:\n\n\"and that's exactly what they'll go through in detail on the planning call.\"\n\n1. \"How much do you charge?\"\n2. \"What's included in that?\"\n3. \"Do you take care of cleaning?\"\n4. \"Who pays for the cleaning?\"\n5. \"Do you charge an onboarding fee?\"\n6. \"What's the minimum contract length?\"\n7. \"Can I try it shorter / month-to-month?\"\n8. \"Can you give me projections?\"\n9. \"Do you guarantee income / is it rent-to-rent?\"\n10. \"Will I lose my existing Airbnb/Booking.com setup?\"",
   "objectives": [
    "Say each of the 10 management answers out loud 5 times, each time finishing with the pivot line"
   ],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 90,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 45,
   "hasQuiz": false,
   "questions": [],
   "downloads": []
  },
  {
   "key": "alt-walk",
   "title": "Day 2 · Walkthrough + Hand-Writing (60–90 min)",
   "kind": "reading",
   "isTask": true,
   "readingBody": "# Walkthrough + Hand-Writing (60–90 min)\n\n1. Go through each of the 10 objections and answers together with Sean.\n2. Hand-write each objection and its answer once.\n3. Sean says the objection; you read the answer from the page word-for-word.\n\nFocus on clear tone and no mumbling.",
   "objectives": [
    "Go through all 10 objections with Sean, hand-write each one, then read the answers word-for-word"
   ],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 90,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 90,
   "hasQuiz": false,
   "questions": [],
   "downloads": []
  },
  {
   "key": "alt-nopaper",
   "title": "Day 2 · No-Paper Drill (60 min)",
   "kind": "reading",
   "isTask": true,
   "readingBody": "# No-Paper Drill (60 min)\n\n1. Take the paper away.\n2. Rapid-fire drill:\n   - Sean: says an objection.\n   - You: give the answer from memory, then add a version of: \"and that's exactly what they'll go through in detail on the planning call.\"\n3. Rotate through all 10 objections multiple times.\n4. Record 10 minutes of this. Listen to 2–3 clips so you can hear:\n   - Where you hesitate.\n   - Where you add \"ums\" or ramble.",
   "objectives": [
    "Answer all 10 objections from memory, add the pivot line, and record 10 minutes of it"
   ],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 90,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 60,
   "hasQuiz": false,
   "questions": [],
   "downloads": []
  },
  {
   "key": "alt-hard",
   "title": "Day 2 · Role-Play \"Hard Landlord\" (60 min)",
   "kind": "reading",
   "isTask": true,
   "readingBody": "# Role-Play \"Hard Landlord\" (60 min)\n\n1. Sean plays a sceptical landlord.\n2. In one mock call, he hits you with: price, onboarding fee, contract length, projections, cleaning, rent guarantee.\n3. Your job:\n   - Give the exact short answer from the list.\n   - Then pivot back to: \"That's exactly what they'll run through with you on the planning call,\" plus a booking or re-commitment line if he tries to stall.\n4. Do at least 3 full role-play calls, each 10–15 minutes.",
   "objectives": [
    "Do at least 3 full role-play calls (10–15 minutes each) against a sceptical landlord"
   ],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 90,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 60,
   "hasQuiz": false,
   "questions": [],
   "downloads": []
  },
  {
   "key": "alt-live",
   "title": "Day 2 · Live Calls With Spot-Coaching (60–90 min)",
   "kind": "reading",
   "isTask": true,
   "readingBody": "# Live Calls With Spot-Coaching (60–90 min)\n\n1. You do real calls where management might come up, while Sean:\n   - Listens live on mute, or\n   - Reviews the recordings same day.\n2. After each call, you get exactly two notes:\n   - 1 thing you did well (e.g. \"You nailed the onboarding fee answer.\")\n   - 1 thing to fix (e.g. \"You dodged the projections question instead of using the form line.\")",
   "objectives": [
    "Do real calls where management might come up, and get two notes after each one"
   ],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 90,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 90,
   "hasQuiz": false,
   "questions": [],
   "downloads": []
  },
  {
   "key": "alt-lockin",
   "title": "Day 2 · Lock-In Quiz (30 min)",
   "kind": "reading",
   "isTask": true,
   "readingBody": "# Lock-In Quiz (30 min)\n\n1. Final drill: Sean randomly throws each of the 10 objections at you, with no warning.\n2. For each one, you must:\n   - Say the first sentence of the answer exactly.\n   - Add a pivot line like: \"and that's exactly what [Closer] will walk you through properly on the call so you can see if it makes sense.\"\n\nIf you can do all 10 cleanly, under pressure, you're ready. If you stumble on any, repeat the Walkthrough + Hand-Writing for those specific objections the next morning until they're automatic.",
   "objectives": [
    "Handle all 10 objections cleanly, under pressure, with no warning"
   ],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 90,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 30,
   "hasQuiz": false,
   "questions": [],
   "downloads": []
  },
  {
   "key": "alt-quiz2",
   "title": "Day 2 · Quiz",
   "kind": "reading",
   "isTask": false,
   "readingBody": "# Day 2 · Quiz\n\nDay 2 is a pressure test: 30 questions, most of them live-call scenarios where you have to pick the right move, not just recall a fact. Part A puts you inside real calls – branching, objections mid-flow, stalls, leads who won't choose. Part B checks you understand the pivot discipline and the training drills you've just been through.\n\nSit it after the Lock-In Quiz, closed book. Pass mark is 27/30. Any scenario you get wrong becomes a role-play the next morning before you go live.\n\n- Part A – Live-call scenarios (questions 1–23)\n- Part B – Pivot discipline and the training drills (questions 24–30)",
   "objectives": [
    "Take the 30-question Day 2 quiz. Pass mark: 27/30"
   ],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 90,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 30,
   "hasQuiz": true,
   "questions": [
    {
     "key": "alt-d2-q1",
     "prompt": "Lead: \"I'm happy running it myself, I just have gaps in January and February I'd like filled.\" Which branch?",
     "options": [
      "Branch B – book a management call, gaps mean they need help",
      "Branch A – Hybrid; they're happy managing and want extra bookings on top",
      "Pre-launch – tag and end the call",
      "Hard no – they don't want much"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d2-q2",
     "prompt": "Lead: \"The 11pm messages from guests are killing me. I just want it off my plate.\" Which branch?",
     "options": [
      "Branch A – send the Hybrid link so they can see how it works",
      "Tag as pre-launch",
      "Branch B – full management, book the 20-minute planning call",
      "Offer to answer messages for them as a trial"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "alt-d2-q3",
     "prompt": "Lead says \"both, really,\" Reed asks what annoys them more, and they say \"my cleaners keep letting me down.\" Which branch?",
     "options": [
      "Branch A – they just need more reliable bookings",
      "Branch B – \"hassle/time\" means management",
      "Neither – refer them to a cleaning company",
      "Send the Hybrid link and book a call, to be safe"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d2-q4",
     "prompt": "Lead: \"Just send me the Hybrid link AND book me a call with the closer, I'll decide later.\" What does Reed do?",
     "options": [
      "Do both – the lead asked for it",
      "Book the call only; the closer can send the link",
      "Use the \"what annoys you more\" question to get them to pick one bucket – there's no third option",
      "Send the link only and let them reply if they want a call"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "alt-d2-q5",
     "prompt": "Mid-triage the lead asks \"how much do you charge?\" What is the best response?",
     "options": [
      "\"I can't discuss pricing, the closer handles that\"",
      "\"It's 15%\"",
      "\"We're cheaper than most agencies\"",
      "\"For full management we're usually between 14% and 17% of booking revenue depending on the level of service – on the planning call they'll work out what makes most sense for your place\""
     ],
     "correctIndex": 3,
     "explanation": ""
    },
    {
     "key": "alt-d2-q6",
     "prompt": "Lead asks what they'd earn. Reed says \"a 2-bed in your town? Easily £2,500 a month.\" What went wrong?",
     "options": [
      "Nothing – a confident number helps close",
      "He made up a projection instead of offering the short form and letting the closer build real projections on the planning call",
      "He should have said £3,000 to be safe",
      "He should have refused to discuss numbers at all"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d2-q7",
     "prompt": "Lead: \"£495 onboarding? What am I actually paying for?\" Best answer?",
     "options": [
      "\"It's mainly admin costs\"",
      "\"It's refundable after 6 months\"",
      "\"It covers getting everything set up properly – listings, photos where needed, pricing, and connecting you into all the channels – so we hit the ground running. They'll go through exactly what that includes on the next call\"",
      "\"We can waive it if you sign today\""
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "alt-d2-q8",
     "prompt": "Lead: \"Can I just do 3 months to see if it works?\" Best answer?",
     "options": [
      "\"Sure, we can do 3 months\"",
      "\"No, it's 12 months minimum\"",
      "\"Let me check with the closer and come back to you\"",
      "\"We've found 6 months with 2-month notice is the shortest that still lets us do a proper job – set everything up, get you on all the platforms, and actually see results. If it doesn't feel right, you can give notice and step away\""
     ],
     "correctIndex": 3,
     "explanation": ""
    },
    {
     "key": "alt-d2-q9",
     "prompt": "Lead: \"Will you guarantee me £1,500 a month? That's what the last company offered.\" Best answer?",
     "options": [
      "\"We can match that\"",
      "\"No, we don't do fixed-rent guarantees. It's percentage of revenue, so we only make more when you make more – we're incentivised to grow the bookings, not lock you into a rent number\"",
      "\"We guarantee a minimum occupancy instead\"",
      "\"Only if the property is in a city\""
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d2-q10",
     "prompt": "Lead: \"I've got 80 five-star reviews on Airbnb. I'm not deleting that.\" Best answer?",
     "options": [
      "\"We'd need a fresh listing under our account\"",
      "\"You keep the reviews but we rename the listing\"",
      "\"No – you still own the listings. We either optimise what you've got or rebuild it properly under management so it performs better, but you don't lose the asset\"",
      "\"The reviews transfer across to Booking.com\""
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "alt-d2-q11",
     "prompt": "Lead: \"So who's paying the cleaner – me?\" Best answer?",
     "options": [
      "\"Yes, it comes out of your payout\"",
      "\"Keapr covers it from the management fee\"",
      "\"The guest pays a cleaning fee – that covers the cleans, so it's not coming out of your pocket\"",
      "\"It depends on the property\""
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "alt-d2-q12",
     "prompt": "Lead: \"Why does it have to be 6 months?\" Best answer?",
     "options": [
      "\"It's just our policy\"",
      "\"So you're not locked in forever, but it's long enough that it's worth us setting everything up properly\"",
      "\"Because the onboarding fee only covers 6 months\"",
      "\"Shorter contracts aren't legal\""
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d2-q13",
     "prompt": "Lead picks Tuesday at 2pm. Reed says \"Great, Tuesday 2pm it is, speak then!\" and hangs up. What did he miss?",
     "options": [
      "Nothing – the booking is done",
      "Confirming the Hybrid link was sent",
      "The commitment question, edifying the closer, and confirming the number and email with reminders",
      "Asking for the full property address"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "alt-d2-q14",
     "prompt": "After the commitment question the lead says \"probably, yeah, I think so.\" What should Reed do?",
     "options": [
      "Accept it and end the call",
      "Use a re-commitment line or offer an alternative slot – a vague yes is a stall",
      "Cancel the booking and send the Hybrid link instead",
      "Ask the closer to call them to confirm"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d2-q15",
     "prompt": "Which of these is NOT part of the Branch B lock-in sequence?",
     "options": [
      "\"Is there any reason you think you won't be able to make that appointment?\"",
      "\"You'll be speaking with [Closer], one of our experts in contractor and insurance stays and hands-off management\"",
      "\"I'll text and email you a link now that walks you through how it works\"",
      "\"We'll send a short confirmation and a reminder or two before the call so you know it's us\""
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "alt-d2-q16",
     "prompt": "Reed answers the contract-length objection perfectly, then goes quiet. What's missing?",
     "options": [
      "A discount offer",
      "A second objection answer",
      "The pivot back to the planning call",
      "The Hybrid link"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "alt-d2-q17",
     "prompt": "Which is the standard pivot line after any management objection?",
     "options": [
      "\"Does that answer your question?\"",
      "\"And that's exactly what [Closer] will walk you through properly on the call so you can see if it makes sense\"",
      "\"Shall I send you our brochure?\"",
      "\"I'll get the closer to email you about that\""
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d2-q18",
     "prompt": "Lead: \"We go live in two weeks – can you take it on from day one?\" What does the script say?",
     "options": [
      "Book a management call now so the closer can plan the launch",
      "Tag as pre-launch, confirm best email, say Keapr will send material to help when they're ready, end the call",
      "Send the Hybrid link so they can plug in on launch day",
      "Ask for the Airbnb draft link to review"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d2-q19",
     "prompt": "Lead: \"I'm about to walk into a meeting, call me back.\" Correct move?",
     "options": [
      "\"No problem, what time suits?\"",
      "\"I'll email you instead\"",
      "\"No problem at all. When's a better time for a quick 5-minute call? I've got [Day] at [Time A] or [Day] at [Time B] – what's easier?\" then book, repeat the time, stop",
      "Try to squeeze in Question 2 before they go"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "alt-d2-q20",
     "prompt": "Lead fires three objections in a row: price, contract, cleaning. What is the principle Reed follows?",
     "options": [
      "Answer the first one and ignore the rest",
      "Answer each clearly, don't waffle, then point them back to the planning call",
      "Say \"the closer will cover all of that\" and move on",
      "Offer to email written answers"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d2-q21",
     "prompt": "Lead: \"I don't want more bookings and I'm fine managing it myself.\" What does Reed say?",
     "options": [
      "\"Let me at least send the Hybrid link in case\"",
      "\"Can I ask why you registered then?\"",
      "\"Totally fine, thanks for being straight with me. I'll make a note not to bug you\"",
      "\"Would you be open to a call anyway?\""
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "alt-d2-q22",
     "prompt": "Lead asks for projections and says yes to the form. Why does Reed send it?",
     "options": [
      "So the closer doesn't waste half the call asking basics and the lead gets to the numbers faster",
      "So Reed can work out the projections himself before the call",
      "To check the property qualifies for management",
      "Because it's required before any booking"
     ],
     "correctIndex": 0,
     "explanation": ""
    },
    {
     "key": "alt-d2-q23",
     "prompt": "Which lead is correctly tagged HYBRID-INTEREST – LINK SENT?",
     "options": [
      "Already hosting, wants it hands-off, call booked with the closer",
      "Not live yet, email confirmed",
      "Already hosting, happy managing, wants extra bookings, link texted and emailed",
      "Not interested, note made not to bug them"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "alt-d2-q24",
     "prompt": "In the Day 2 \"Hard Landlord\" role-play, which objections does the trainer hit Reed with?",
     "options": [
      "Price and contract length only",
      "Price, onboarding fee, contract length, projections, cleaning, rent guarantee",
      "Whatever comes up naturally",
      "The ten objections in order"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d2-q25",
     "prompt": "How many full role-play calls are required, and how long is each?",
     "options": [
      "One, 30 minutes",
      "Two, 5 minutes each",
      "At least three, 10–15 minutes each",
      "Five, 20 minutes each"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "alt-d2-q26",
     "prompt": "After each live call in Live Calls With Spot-Coaching, how much feedback does Reed get?",
     "options": [
      "A full written review",
      "Exactly two notes – one thing he did well, one thing to fix",
      "A score out of ten",
      "Only feedback if something went wrong"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d2-q27",
     "prompt": "In the Lock-In Quiz, what must Reed do for each objection thrown at him?",
     "options": [
      "Say the first sentence of the answer exactly, then add a pivot line to the closer's call",
      "Read the full answer from the one-pager",
      "Give any answer in his own words",
      "Say the answer and the fee"
     ],
     "correctIndex": 0,
     "explanation": ""
    },
    {
     "key": "alt-d2-q28",
     "prompt": "Reed stumbles on two objections in the Lock-In Quiz. What happens?",
     "options": [
      "He goes live anyway – two is acceptable",
      "He re-sits the whole quiz the same afternoon",
      "Repeat the Walkthrough + Hand-Writing for those specific objections the next morning until they're automatic",
      "The trainer takes those objections off his list"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "alt-d2-q29",
     "prompt": "In the Day 2 No-Paper Drill, why is 10 minutes recorded and played back?",
     "options": [
      "To build a library of sample calls for new starters",
      "So Reed can hear where he hesitates and where he adds \"ums\" or rambles",
      "To check the answers against the one-pager",
      "For compliance"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "alt-d2-q30",
     "prompt": "In the Day 2 Walkthrough + Hand-Writing, what does Reed physically do with each objection?",
     "options": [
      "Type it into a shared doc",
      "Record himself saying it",
      "Hand-write the objection and its answer once, then read the answer word-for-word when the trainer says the objection",
      "Memorise it silently"
     ],
     "correctIndex": 2,
     "explanation": ""
    }
   ],
   "downloads": []
  }
 ],
 "checklist": []
}$draft$::jsonb;
  v_video jsonb;
begin
  select id into v_admin from public.profiles where role = 'admin' and is_active order by created_at limit 1;
  if v_admin is null then
    raise exception 'No active admin found.';
  end if;

  select id, draft into v_course, v_old from public.courses where title = 'Ad-Lead Triage' order by created_at limit 1;

  if v_course is null then
    insert into public.courses (title, description, is_demo, created_by, draft)
    values ('Ad-Lead Triage', 'Two-day training for ad-lead triage calls: the triage script, your pay, and the 10 management objections. A 30-question quiz at the end of each day (pass mark 27/30).', false, v_admin, v_new);
    raise notice 'Created "Ad-Lead Triage" as a draft. Upload the video and the two PDFs, preview, then publish.';
    return;
  end if;

  -- Already there: replace the draft, keeping the uploaded training video.
  select l into v_video from jsonb_array_elements(coalesce(v_old->'lessons', '[]'::jsonb)) l
  where l->>'key' = 'alt-video' and coalesce(l->>'videoRef', '') <> '' limit 1;
  if v_video is not null then
    v_new := jsonb_set(v_new, '{lessons,0,videoRef}', v_video->'videoRef');
    v_new := jsonb_set(v_new, '{lessons,0,videoSeconds}', coalesce(v_video->'videoSeconds', '0'::jsonb));
  end if;

  update public.courses set draft = v_new, description = 'Two-day training for ad-lead triage calls: the triage script, your pay, and the 10 management objections. A 30-question quiz at the end of each day (pass mark 27/30).', updated_at = now() where id = v_course;
  raise notice 'Updated the "Ad-Lead Triage" draft. Check the video, upload the Day 1 PDF (lesson 2) and Day 2 PDF (lesson 7), preview, then publish.';
end $$;

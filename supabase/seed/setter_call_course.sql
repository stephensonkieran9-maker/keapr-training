-- Keapr Training: "Setter Call Training", rebuilt to follow the Setter Onboarding Plan.
-- Needs migrations 0014 (reading lessons) and 0015 (checklists).
--   1. Welcome from Sean          video, no quiz      + Day 1 orientation and script-reps checklist
--   2. Anatomy of a Pitch         video, 50-question quiz (pass 90% = 45)  + training video, blackout and quiz checklist
--   3. Day 1 Recordings           reading, no quiz    + the three recordings checklist
--   4. Day 2: Live with Sean      reading, no quiz    + Day 2 checklist
-- Questions and checklist items come only from the video, the script, the
-- objection sheet, the original quiz and the onboarding plan.
--
-- If the course already exists, its draft is replaced, keeping the Anatomy
-- of a Pitch video and any downloads already uploaded (the script PDF moves
-- to lesson 1). Otherwise the course is created. Nothing is published:
-- upload Sean's welcome video to lesson 1, preview, then Publish.

do $$
declare
  v_admin uuid;
  v_course uuid;
  v_old jsonb;
  v_new jsonb := $draft${
 "lessons": [
  {
   "key": "sc-welcome",
   "title": "Welcome from Sean",
   "kind": "video",
   "readingBody": "",
   "objectives": [
    "Your role and what's expected of you, from Sean",
    "Your first two days: master one call and twelve objections",
    "Your only job: book a clean 20-minute planning call with the closer"
   ],
   "notes": "Your first two days are about one thing: mastering one call and twelve objections. You are not selling management or tech. Your only job is to book a clean 20-minute planning call with the closer.\n\nWatch the whole video to finish this lesson. The script and objection sheet are under Downloads: read both once, top to bottom, then work through the checklist below.",
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
   "key": "sc-pitch",
   "title": "Anatomy of a Pitch",
   "kind": "video",
   "readingBody": "",
   "objectives": [
    "Why the setter's one job is to book a 20-minute planning call with the closer",
    "Why the call opens with \"Is now a terrible time?\"",
    "The four rules: enquiry-only, through us first, you set the price, we decline",
    "How to answer \"What's your cut?\" without quoting a percentage",
    "The golden bridge, and offering two specific times straight after it"
   ],
   "notes": "Watch at least 90% of the video to unlock the quiz. Skipping ahead doesn't count.\n\nQuiz: 50 questions on the video, the script, the objection sheet and your onboarding plan. Target: 90%+ (45 right).\n\nAny question you miss: find that line in the script or objection sheet and read it out loud 5 times.",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 90,
   "requiredWatchPercent": 90,
   "isRequired": true,
   "estimatedMinutes": null,
   "hasQuiz": true,
   "questions": [
    {
     "key": "sc-pitch-q1",
     "prompt": "What is the setter's one job on these calls?",
     "options": [
      "Sell Keapr's full management service",
      "Book a 20-minute planning call with the closer",
      "Quote the commission and payment terms",
      "Secure a first booking on the call"
     ],
     "correctIndex": 1,
     "explanation": "Your only job is to book a clean 20-minute planning call with the closer."
    },
    {
     "key": "sc-pitch-q2",
     "prompt": "Why is a 20-minute chat that ends with no booking counted as a loss?",
     "options": [
      "Because the owner will complain",
      "Because the setter has done the closer's job badly and lost the appointment",
      "Because long calls cost Keapr money",
      "Because the owner was probably not interested"
     ],
     "correctIndex": 1,
     "explanation": "A win is a booked appointment. A lovely chat with no booking means the setter tried to do the closer's job, did it badly, and lost the appointment."
    },
    {
     "key": "sc-pitch-q3",
     "prompt": "Who is on the list the setter is calling?",
     "options": [
      "Random Airbnb hosts scraped from the internet",
      "Owners already managed by Keapr",
      "Owners who asked to join Keapr's landlord database and wanted more bookings",
      "Estate agents and letting agents"
     ],
     "correctIndex": 2,
     "explanation": "\"You asked to be added to our landlord database a while back.\""
    },
    {
     "key": "sc-pitch-q4",
     "prompt": "Which platforms are most of these owners on?",
     "options": [
      "Direct booking websites only",
      "Airbnb only, Booking.com only, or both, with nothing else behind them",
      "Corporate housing platforms",
      "Insurance databases"
     ],
     "correctIndex": 1,
     "explanation": "\"I'm working through a list of places that are mainly on Airbnb or Booking.com.\""
    },
    {
     "key": "sc-pitch-q5",
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
     "key": "sc-pitch-q6",
     "prompt": "What does the setter say straight after the owner answers \"Is now a terrible time?\"",
     "options": [
      "\"Perfect, I'll be quick.\"",
      "\"Great, let me tell you all about Keapr.\"",
      "\"When would be a better time?\"",
      "\"Can I take your email?\""
     ],
     "correctIndex": 0,
     "explanation": "Section 2 of the script opens: \"Perfect, I'll be quick.\""
    },
    {
     "key": "sc-pitch-q7",
     "prompt": "The owner says a clean \"no\" at the interest check. What does the setter do?",
     "options": [
      "Try a second angle",
      "Ask why",
      "Thank them, note the reason, leave the door open and end the call",
      "Offer a discount"
     ],
     "correctIndex": 2,
     "explanation": "\"Totally fine, I'll make a note of that and leave you be. If things change and you ever want a few more options, just let us know and we can look at it again.\" [End.]"
    },
    {
     "key": "sc-pitch-q8",
     "prompt": "Before the long-stay question, what does the setter ask about the owner's current bookings?",
     "options": [
      "How much they charge per night",
      "Whether bookings are mostly short stays and weekends, or they're pretty well covered midweek too",
      "How many reviews they have",
      "Who cleans the property"
     ],
     "correctIndex": 1,
     "explanation": "\"How are bookings at the moment – mostly short stays and weekends, or are you pretty well covered midweek too?\""
    },
    {
     "key": "sc-pitch-q9",
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
     "key": "sc-pitch-q10",
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
     "key": "sc-pitch-q11",
     "prompt": "What is the one real qualifier on the call?",
     "options": [
      "Whether the property has parking",
      "Whether long stays of 28-plus nights would be okay in principle",
      "Whether the owner has five-star reviews",
      "Whether the owner has been hosting for over a year"
     ],
     "correctIndex": 1,
     "explanation": "\"Would those kinds of longer stays be okay for you if the price and dates made sense?\" If they say no to long stays, the call ends."
    },
    {
     "key": "sc-pitch-q12",
     "prompt": "Which channels does the setter say Keapr sits in the middle of?",
     "options": [
      "Airbnb, Booking.com and Vrbo",
      "Insurance databases, corporate and contractor platforms, and some closed networks",
      "Estate agents and letting agents",
      "Facebook groups and local listings sites"
     ],
     "correctIndex": 1,
     "explanation": "\"We sit in the middle of a bunch of channels that normal hosts don't touch – insurance databases, corporate and contractor platforms, and some closed networks.\""
    },
    {
     "key": "sc-pitch-q13",
     "prompt": "Which of these is NOT one of the four rules the owner needs to hear?",
     "options": [
      "Nothing is instant book — everything is enquiry-only",
      "Every enquiry comes through Keapr first, no obligation",
      "Keapr guarantees a set number of bookings a year",
      "The owner sets the price every time"
     ],
     "correctIndex": 2,
     "explanation": "The four rules: enquiry-only, through us first with no obligation, you set the price, and we decline if the dates don't work."
    },
    {
     "key": "sc-pitch-q14",
     "prompt": "What happens if the dates on an enquiry don't work for the owner?",
     "options": [
      "Keapr negotiates with the owner to move their other bookings",
      "Keapr declines it — no drama",
      "The owner is charged a cancellation fee",
      "The enquiry is held open for 48 hours"
     ],
     "correctIndex": 1,
     "explanation": "\"If the dates don't work, we decline it. No drama.\""
    },
    {
     "key": "sc-pitch-q15",
     "prompt": "What is the example enquiry the setter should use on every call?",
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
     "key": "sc-pitch-q16",
     "prompt": "Why must the setter say \"there'll be plenty you say no to\"?",
     "options": [
      "To put the owner off",
      "It keeps the pitch honest and stops the closer inheriting an owner who expects a flood of bookings",
      "It is a joke to lighten the mood",
      "To make the owner negotiate harder"
     ],
     "correctIndex": 1,
     "explanation": "\"If yes, we lock in a long booking. If no, nothing changes. There'll be plenty you say no to, and some that are a no-brainer.\""
    },
    {
     "key": "sc-pitch-q17",
     "prompt": "What does \"because we're selective with who we plug in\" do?",
     "options": [
      "Makes the owner feel they are being considered rather than sold to",
      "Warns the owner they may be rejected",
      "Explains the fee",
      "Nothing — it can be skipped"
     ],
     "correctIndex": 0,
     "explanation": "\"Because we're selective with who we plug in, we do a quick planning call first.\""
    },
    {
     "key": "sc-pitch-q18",
     "prompt": "Which three things does the setter say the planning call looks at?",
     "options": [
      "Their current setup on Airbnb / Booking.com, what kind of 28-plus-night bookings would work for them, and how we'd connect them while they stay in control on price",
      "Their mortgage, their insurance and their tax",
      "Their reviews, their photos and their cleaning team",
      "A contract, a fee and a start date"
     ],
     "correctIndex": 0,
     "explanation": "These are the three points listed in section 5 of the script."
    },
    {
     "key": "sc-pitch-q19",
     "prompt": "How does the setter describe the worst case of having the planning call?",
     "options": [
      "\"You'll have lost 20 minutes\"",
      "\"You decide you're happier as you are and we take you off the list\"",
      "\"You'll be tied in for a month\"",
      "\"You'll pay a small fee\""
     ],
     "correctIndex": 1,
     "explanation": "\"Worst case, you decide you're happier as you are and we take you off the list. Best case, you pick up a few extra longer bookings a year, on your terms.\""
    },
    {
     "key": "sc-pitch-q20",
     "prompt": "How long is the planning call?",
     "options": [
      "5 minutes",
      "20 minutes",
      "45 minutes",
      "An hour"
     ],
     "correctIndex": 1,
     "explanation": "\"Would you be open to a short 20-minute session to see what that could look like?\""
    },
    {
     "key": "sc-pitch-q21",
     "prompt": "How should the setter offer appointment times?",
     "options": [
      "\"When suits you?\"",
      "Two specific slots within the next three working days, then \"what's easier?\"",
      "A link to a booking calendar",
      "Ask them to call back when free"
     ],
     "correctIndex": 1,
     "explanation": "\"I've got [Day, Time A] or [Day, Time B] – what's easier?\" Never ask \"when suits you\"."
    },
    {
     "key": "sc-pitch-q22",
     "prompt": "Which of these is the setter allowed to say?",
     "options": [
      "\"Guaranteed bookings\"",
      "\"Someone will give you a call\" with no time booked",
      "\"There'll be plenty you say no to, and some that are a no-brainer\"",
      "\"Our commission is 15%\""
     ],
     "correctIndex": 2,
     "explanation": "This line is in the \"how it works\" section of the script."
    },
    {
     "key": "sc-pitch-q23",
     "prompt": "The owner asks \"What's the catch / am I tied in?\" What does the setter say?",
     "options": [
      "\"There's a small monthly fee\"",
      "\"There's no tie-in and no instant bookings. If at any point you don't like it, we just stop sending enquiries and remove you from that network\"",
      "\"You have to accept the first booking\"",
      "\"The closer will explain the catch\""
     ],
     "correctIndex": 1,
     "explanation": "Section 6 of the script, word for word."
    },
    {
     "key": "sc-pitch-q24",
     "prompt": "What is the bridge line?",
     "options": [
      "\"Let me put you through to my manager\"",
      "\"That's exactly what [Closer Name] will run through with you properly on the planning call\"",
      "\"I'll send you a brochure\"",
      "\"Can I take your email?\""
     ],
     "correctIndex": 1,
     "explanation": "The golden bridge: it respects the question and hands the detail to the planning call. Follow it straight away with two times."
    },
    {
     "key": "sc-pitch-q25",
     "prompt": "What is the one-answer rule?",
     "options": [
      "Answer every objection with one word",
      "Give one calm answer, bridge, and if asked again give a shorter version of the same answer — never a new angle",
      "Only answer one objection per call",
      "Let the owner answer their own question"
     ],
     "correctIndex": 1,
     "explanation": "\"Answer once, then always finish with 'That's exactly what [Closer Name] will run through with you properly on the planning call,' and go back to booking the time.\""
    },
    {
     "key": "sc-pitch-q26",
     "prompt": "How should the setter treat an objection?",
     "options": [
      "As a sign the owner is not interested",
      "As a checkpoint that shows the owner is interested enough to check",
      "As a debate to win",
      "As a reason to hand the call to the closer immediately"
     ],
     "correctIndex": 1,
     "explanation": "Objections aren't arguments to be won. They're predictable checkpoints."
    },
    {
     "key": "sc-pitch-q27",
     "prompt": "Owner asks \"Do you charge to onboard?\" The setter says:",
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
     "key": "sc-pitch-q28",
     "prompt": "What is the only thing the setter should say about Keapr's commission?",
     "options": [
      "It is 15%",
      "It is taken out of the owner's rate",
      "The owner gives their number and Keapr adds its commission on top for the client",
      "It depends on the owner's star rating"
     ],
     "correctIndex": 2,
     "explanation": "\"You get your number, and we make our bit on top.\""
    },
    {
     "key": "sc-pitch-q29",
     "prompt": "When the owner asks about your cut, what are the two ways the setter says an enquiry comes in?",
     "options": [
      "Instant book or request to book",
      "Either the client offers a price (\"They want to pay £150 a night for 61 nights…\") or we ask what the owner needs and add our commission on top",
      "Through Airbnb or through Booking.com",
      "Weekly or monthly"
     ],
     "correctIndex": 1,
     "explanation": "Objection 2 on the sheet."
    },
    {
     "key": "sc-pitch-q30",
     "prompt": "Owner pushes for an exact commission percentage. The setter should:",
     "options": [
      "Quote 12%",
      "Quote a range",
      "Never quote a percentage — bridge to the closer, who has real examples",
      "Say it is confidential"
     ],
     "correctIndex": 2,
     "explanation": "\"The detail of that is what [Closer Name] will walk you through on the call, with real examples.\""
    },
    {
     "key": "sc-pitch-q31",
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
     "key": "sc-pitch-q32",
     "prompt": "Owner asks \"When will I get paid?\" The right answer is:",
     "options": [
      "\"30 days\"",
      "\"Each client has different schedules; on the planning call the closer shows the typical timelines so you know before you say yes to anything\"",
      "\"Same day\"",
      "\"Whenever the contractor pays us\""
     ],
     "correctIndex": 1,
     "explanation": "Objection 3 on the sheet."
    },
    {
     "key": "sc-pitch-q33",
     "prompt": "Owner asks \"Do I have to be the cheapest?\" The setter says:",
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
     "key": "sc-pitch-q34",
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
     "key": "sc-pitch-q35",
     "prompt": "Owner asks \"Am I tied in? Is there a contract?\" The setter says:",
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
     "key": "sc-pitch-q36",
     "prompt": "Owner asks \"Do I have to accept every booking you send?\" The setter says:",
     "options": [
      "\"Yes, that's how the network works\"",
      "\"Not at all. Every enquiry is optional. We'll bring you the dates, length, and rate and you just decide: yes or no\"",
      "\"Only the first three\"",
      "\"Only if the price is above your Airbnb rate\""
     ],
     "correctIndex": 1,
     "explanation": "Objection 6 on the sheet."
    },
    {
     "key": "sc-pitch-q37",
     "prompt": "Owner asks \"Do I lose control of pricing?\" Which line should the setter keep?",
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
     "key": "sc-pitch-q38",
     "prompt": "On the damages objection, which three reassurances does the setter give?",
     "options": [
      "Insurance covers everything, we pay for cleaning, we visit weekly",
      "Mostly contractors and corporate not hen parties; a security deposit can be taken; we know exactly who is in the property",
      "Guests are vetted by Airbnb, we have a 24/7 line, nothing ever goes wrong",
      "The closer handles it, don't worry, it's rare"
     ],
     "correctIndex": 1,
     "explanation": "Objection 8 on the sheet."
    },
    {
     "key": "sc-pitch-q39",
     "prompt": "Owner asks \"Will this mess with my Airbnb account?\" The setter says:",
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
     "key": "sc-pitch-q40",
     "prompt": "Owner asks \"Can I still use the property myself?\" The setter says:",
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
     "key": "sc-pitch-q41",
     "prompt": "Owner asks \"Why can't you just send me info? Why a call?\" What reason does the setter give?",
     "options": [
      "\"Our info pack isn't ready yet\"",
      "Every property and owner is different – area, bills, what you're happy with – and [Closer Name] is the one who can look at the place properly and run numbers",
      "\"We don't send emails\"",
      "\"It's company policy\""
     ],
     "correctIndex": 1,
     "explanation": "Objection 11 on the sheet."
    },
    {
     "key": "sc-pitch-q42",
     "prompt": "Owner asks \"Is there any upfront cost at all?\" The setter says:",
     "options": [
      "\"Just a small admin fee\"",
      "\"There's no upfront fee to be in the network and no charge just to have the call\"",
      "\"Only if you take a booking\"",
      "\"The closer will tell you\""
     ],
     "correctIndex": 1,
     "explanation": "Objection 12 on the sheet: \"You only ever commit if a booking and a price make sense for you.\""
    },
    {
     "key": "sc-pitch-q43",
     "prompt": "What is the target length of a setter call?",
     "options": [
      "Under 1 minute",
      "3 to 5 minutes",
      "10 to 15 minutes",
      "As long as the owner wants"
     ],
     "correctIndex": 1,
     "explanation": "Pacing: a 3–5 minute target call length."
    },
    {
     "key": "sc-pitch-q44",
     "prompt": "What should a handover note to the closer cover?",
     "options": [
      "The owner's age, job and mortgage",
      "Platforms, midweek situation, objections raised and booked time",
      "The property's square footage, year built and EPC",
      "Nothing — the closer starts fresh"
     ],
     "correctIndex": 1,
     "explanation": "The standard: Sean can understand the owner and what to lead with in under 10 seconds of reading."
    },
    {
     "key": "sc-pitch-q45",
     "prompt": "What is the roleplay drill plan for a new setter?",
     "options": [
      "One two-hour session on day one",
      "15 minutes a day, every day, for 10 working days",
      "Once a week for a month",
      "Only after the first live call goes wrong"
     ],
     "correctIndex": 1,
     "explanation": "\"First week: roleplay every one of these objections daily for 15 minutes… You do that for 10 working days.\""
    },
    {
     "key": "sc-pitch-q46",
     "prompt": "In the Day 1 \"Objection Gauntlet\" recording, which objections do you answer, in order?",
     "options": [
      "1, 2, 5, 11 and 12",
      "All 12",
      "3, 4, 6, 7 and 8",
      "Any three you choose"
     ],
     "correctIndex": 0,
     "explanation": "Each one is a short answer from the sheet, then the bridge line."
    },
    {
     "key": "sc-pitch-q47",
     "prompt": "How does the blackout memorisation exercise work?",
     "options": [
      "Read the script with the lights off",
      "Print the script twice; on the working copy, read it out loud, black out a few words, read it again, and keep going until you can get through sections 1–5 with most of the page blacked out",
      "Write the script out from memory once",
      "Record yourself and listen back at night"
     ],
     "correctIndex": 1,
     "explanation": "Copy 1 stays clean as your reference. Copy 2 is the working copy you black out."
    },
    {
     "key": "sc-pitch-q48",
     "prompt": "Which three recordings do you send by 17:00 on Day 1?",
     "options": [
      "A full script run-through, an \"easy yes\" example call roleplay, and the objection gauntlet",
      "Three real calls to owners",
      "A welcome video, a voicemail and a handover note",
      "Three takes of the opener"
     ],
     "correctIndex": 0,
     "explanation": "Phone recordings are fine."
    },
    {
     "key": "sc-pitch-q49",
     "prompt": "After the quiz, what do you do with any question you missed?",
     "options": [
      "Nothing, move on",
      "Find that line in the script or objection sheet and read it out loud 5 times",
      "Ask Sean for the answer",
      "Retake the quiz straight away"
     ],
     "correctIndex": 1,
     "explanation": "From the Day 1 plan."
    },
    {
     "key": "sc-pitch-q50",
     "prompt": "To be cleared for live calls, you must hit standard on which three things?",
     "options": [
      "Script accuracy, objection handling and handover notes",
      "Speed, volume and accent",
      "Quiz score, attendance and dress code",
      "Number of calls, bookings and revenue"
     ],
     "correctIndex": 0,
     "explanation": "Hit standard on all three in the Day 2 certification roleplays and you're cleared to start live calls on this script."
    }
   ],
   "downloads": []
  },
  {
   "key": "sc-recordings",
   "title": "Day 1 Recordings",
   "kind": "reading",
   "readingBody": "# Day 1 · 15:30–17:00 · Required recordings\n\nRecord and send three videos by 17:00. Phone is fine.\n\n# 1. Full Script Run-Through\n\nYou reading sections 1–6 word-for-word, start to finish.\n\n# 2. Example Call Roleplay\n\nYou as Setter, imaginary Owner.\nRun a full call where the owner is an \"easy yes\" (no objections, just the core script).\n\n# 3. Objection Gauntlet\n\nYou answering objections 1, 2, 5, 11, and 12 in order.\nEach = one short answer from the sheet, then:\n\"That's exactly what [Closer Name] will run through with you properly on the planning call.\"\n\nTick each one off below as you send it, then mark the lesson as done.",
   "objectives": [
    "The three recordings to send by 17:00 on Day 1"
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
   "key": "sc-day2",
   "title": "Day 2: Live with Sean",
   "kind": "reading",
   "readingBody": "# Day 2 · Friday 11:00–17:00 (Live With Sean)\n\nObjective: Clean up delivery, pressure-test objections, and certify you on the script.\n\n# 11:00–12:00 · Review\n\nWith Sean:\n\n- Review your quiz result.\n- Watch key parts of your 3 recordings.\n- Fix any wording errors in sections 1–6.\n- Fix pacing (3–5 minute target call length).\n- Fix use of the bridge line.\n\n# 12:00–13:00 · Live Script Roleplay\n\nRun the full script multiple times:\n\n- 1x \"easy yes\" call.\n- 1–2x \"maybe\" calls where Sean throws in 2–3 objections (use your sheet).\n\nYou must:\n\n- Stick to the script.\n- Answer each objection once, calmly.\n- Use the bridge line and go back to booking the time.\n\n# 13:00–13:30 · Break\n\n# 13:30–14:30 · Objection Drills\n\nRapid-fire objection practice: Sean throws any of the 12 objections in random order.\nYour job: one-line answer from the sheet + bridge line, no looking down.\nGoal: handle all 12 confidently without the paper.\n\n# 14:30–15:30 · Notes & Handover\n\nPractice writing handover notes from mock calls:\nPlatforms, midweek situation, objections raised, booked time.\nStandard: Sean can understand the owner and what to lead with in under 10 seconds of reading.\n\n# 15:30–17:00 · Certification Roleplays\n\n2–3 full calls back-to-back (including at least one polite \"not now\").\n\nIf you hit standard on script accuracy, objection handling and handover notes, you're cleared to start live calls next week on this script.\n\nTick things off below as you go, then mark the lesson as done at the end of the day.",
   "objectives": [
    "Clean up delivery, pressure-test objections, and certify on the script"
   ],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 90,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 360,
   "hasQuiz": false,
   "questions": [],
   "downloads": []
  }
 ],
 "checklist": [
  {
   "key": "sc-c1",
   "section": "Day 1 · 11:00–11:30 · Orientation",
   "label": "Watch Sean's Welcome / Role / Expectations video",
   "lessonKey": "sc-welcome"
  },
  {
   "key": "sc-c2",
   "section": "Day 1 · 11:00–11:30 · Orientation",
   "label": "Read the full Final Setter Script once, top to bottom",
   "lessonKey": "sc-welcome"
  },
  {
   "key": "sc-c3",
   "section": "Day 1 · 11:00–11:30 · Orientation",
   "label": "Read the Objection Sheet once, top to bottom",
   "lessonKey": "sc-welcome"
  },
  {
   "key": "sc-c4",
   "section": "Day 1 · 11:30–12:30 · Script reps",
   "label": "Read the full script (sections 1–6) out loud 5 times",
   "lessonKey": "sc-welcome"
  },
  {
   "key": "sc-c5",
   "section": "Day 1 · 11:30–12:30 · Script reps",
   "label": "Section 1–2 (Opener + Interest Check) – out loud 5 more times",
   "lessonKey": "sc-welcome"
  },
  {
   "key": "sc-c6",
   "section": "Day 1 · 11:30–12:30 · Script reps",
   "label": "Section 4 (How it works + 4 rules + 72-night example) – out loud 5 more times",
   "lessonKey": "sc-welcome"
  },
  {
   "key": "sc-c7",
   "section": "Day 1 · 11:30–12:30 · Script reps",
   "label": "Section 5 (Planning-call close + \"two times\" line) – out loud 5 more times",
   "lessonKey": "sc-welcome"
  },
  {
   "key": "sc-c8",
   "section": "Day 1 · 12:30–13:00 · Training video",
   "label": "Watch the training video once all the way through",
   "lessonKey": "sc-pitch"
  },
  {
   "key": "sc-c9",
   "section": "Day 1 · 12:30–13:00 · Training video",
   "label": "Write down the four rules in your own words",
   "lessonKey": "sc-pitch"
  },
  {
   "key": "sc-c10",
   "section": "Day 1 · 12:30–13:00 · Training video",
   "label": "Write down the bridge line you use after objections",
   "lessonKey": "sc-pitch"
  },
  {
   "key": "sc-c11",
   "section": "Day 1 · 13:30–14:30 · Blackout memorisation",
   "label": "Print the Final Setter Script twice",
   "lessonKey": "sc-pitch"
  },
  {
   "key": "sc-c12",
   "section": "Day 1 · 13:30–14:30 · Blackout memorisation",
   "label": "Copy 1 (clean): keep as reference",
   "lessonKey": "sc-pitch"
  },
  {
   "key": "sc-c13",
   "section": "Day 1 · 13:30–14:30 · Blackout memorisation",
   "label": "Copy 2 (working): read it out loud, black out a few words, read it again",
   "lessonKey": "sc-pitch"
  },
  {
   "key": "sc-c14",
   "section": "Day 1 · 13:30–14:30 · Blackout memorisation",
   "label": "Keep blacking out more words until you can get through sections 1–5 with most of the page blacked out",
   "lessonKey": "sc-pitch"
  },
  {
   "key": "sc-c15",
   "section": "Day 1 · 14:30–15:30 · Quiz",
   "label": "Take the 50-question quiz. Target: 90%+",
   "lessonKey": "sc-pitch"
  },
  {
   "key": "sc-c16",
   "section": "Day 1 · 14:30–15:30 · Quiz",
   "label": "Any question you miss: find that line in the script or objection sheet and read it out loud 5 times",
   "lessonKey": "sc-pitch"
  },
  {
   "key": "sc-c17",
   "section": "Day 1 · 15:30–17:00 · Required recordings (send by 17:00)",
   "label": "Full Script Run-Through: you reading sections 1–6 word-for-word, start to finish",
   "lessonKey": "sc-recordings"
  },
  {
   "key": "sc-c18",
   "section": "Day 1 · 15:30–17:00 · Required recordings (send by 17:00)",
   "label": "Example Call Roleplay: you as Setter, imaginary Owner, a full \"easy yes\" call (no objections, just the core script)",
   "lessonKey": "sc-recordings"
  },
  {
   "key": "sc-c19",
   "section": "Day 1 · 15:30–17:00 · Required recordings (send by 17:00)",
   "label": "Objection Gauntlet: objections 1, 2, 5, 11 and 12 in order, each one short answer from the sheet, then the bridge line",
   "lessonKey": "sc-recordings"
  },
  {
   "key": "sc-c20",
   "section": "Day 1 · 15:30–17:00 · Required recordings (send by 17:00)",
   "label": "Sent all three recordings by 17:00",
   "lessonKey": "sc-recordings"
  },
  {
   "key": "sc-c21",
   "section": "Day 2 · 11:00–12:00 · Review with Sean",
   "label": "Review your quiz result",
   "lessonKey": "sc-day2"
  },
  {
   "key": "sc-c22",
   "section": "Day 2 · 11:00–12:00 · Review with Sean",
   "label": "Watch key parts of your 3 recordings",
   "lessonKey": "sc-day2"
  },
  {
   "key": "sc-c23",
   "section": "Day 2 · 11:00–12:00 · Review with Sean",
   "label": "Fix any wording errors in sections 1–6",
   "lessonKey": "sc-day2"
  },
  {
   "key": "sc-c24",
   "section": "Day 2 · 11:00–12:00 · Review with Sean",
   "label": "Fix pacing (3–5 minute target call length)",
   "lessonKey": "sc-day2"
  },
  {
   "key": "sc-c25",
   "section": "Day 2 · 11:00–12:00 · Review with Sean",
   "label": "Fix use of the bridge line",
   "lessonKey": "sc-day2"
  },
  {
   "key": "sc-c26",
   "section": "Day 2 · 12:00–13:00 · Live script roleplay",
   "label": "1x \"easy yes\" call",
   "lessonKey": "sc-day2"
  },
  {
   "key": "sc-c27",
   "section": "Day 2 · 12:00–13:00 · Live script roleplay",
   "label": "1–2x \"maybe\" calls where Sean throws in 2–3 objections",
   "lessonKey": "sc-day2"
  },
  {
   "key": "sc-c28",
   "section": "Day 2 · 12:00–13:00 · Live script roleplay",
   "label": "Stuck to the script, answered each objection once, calmly, used the bridge line and went back to booking the time",
   "lessonKey": "sc-day2"
  },
  {
   "key": "sc-c29",
   "section": "Day 2 · 13:30–14:30 · Objection drills",
   "label": "Rapid-fire: one-line answer from the sheet + bridge line, no looking down",
   "lessonKey": "sc-day2"
  },
  {
   "key": "sc-c30",
   "section": "Day 2 · 13:30–14:30 · Objection drills",
   "label": "Handled all 12 objections confidently without the paper",
   "lessonKey": "sc-day2"
  },
  {
   "key": "sc-c31",
   "section": "Day 2 · 14:30–15:30 · Notes & handover",
   "label": "Practised writing handover notes from mock calls: platforms, midweek situation, objections raised, booked time",
   "lessonKey": "sc-day2"
  },
  {
   "key": "sc-c32",
   "section": "Day 2 · 14:30–15:30 · Notes & handover",
   "label": "Sean can understand the owner and what to lead with in under 10 seconds of reading",
   "lessonKey": "sc-day2"
  },
  {
   "key": "sc-c33",
   "section": "Day 2 · 15:30–17:00 · Certification roleplays",
   "label": "2–3 full calls back-to-back (including at least one polite \"not now\")",
   "lessonKey": "sc-day2"
  },
  {
   "key": "sc-c34",
   "section": "Day 2 · 15:30–17:00 · Certification roleplays",
   "label": "Hit standard on script accuracy",
   "lessonKey": "sc-day2"
  },
  {
   "key": "sc-c35",
   "section": "Day 2 · 15:30–17:00 · Certification roleplays",
   "label": "Hit standard on objection handling",
   "lessonKey": "sc-day2"
  },
  {
   "key": "sc-c36",
   "section": "Day 2 · 15:30–17:00 · Certification roleplays",
   "label": "Hit standard on handover notes",
   "lessonKey": "sc-day2"
  },
  {
   "key": "sc-c37",
   "section": "Day 2 · 15:30–17:00 · Certification roleplays",
   "label": "Cleared to start live calls on this script",
   "lessonKey": "sc-day2"
  }
 ]
}$draft$::jsonb;
  v_pitch jsonb;
  v_files jsonb;
begin
  select id into v_admin from public.profiles where role = 'admin' and is_active order by created_at limit 1;
  if v_admin is null then
    raise exception 'No active admin found.';
  end if;

  select id, draft into v_course, v_old from public.courses where title = 'Setter Call Training' order by created_at limit 1;

  if v_course is null then
    insert into public.courses (title, description, is_demo, created_by, draft)
    values ('Setter Call Training', 'Setter onboarding, Days 1–2: Sean''s welcome, the Anatomy of a Pitch video with a 50-question quiz, then your Day 1 recordings and Day 2 with Sean. Tick off the onboarding plan as you go.', false, v_admin, v_new);
    raise notice 'Created "Setter Call Training" as a draft.';
    return;
  end if;

  -- Keep the uploaded training video.
  select l into v_pitch from jsonb_array_elements(coalesce(v_old->'lessons', '[]'::jsonb)) l
  where l->>'title' = 'Anatomy of a Pitch' limit 1;
  if v_pitch is not null then
    v_new := jsonb_set(v_new, '{lessons,1,videoRef}', coalesce(v_pitch->'videoRef', '""'::jsonb));
    v_new := jsonb_set(v_new, '{lessons,1,videoSeconds}', coalesce(v_pitch->'videoSeconds', '0'::jsonb));
    v_new := jsonb_set(v_new, '{lessons,1,downloads}', coalesce(v_pitch->'downloads', '[]'::jsonb));
  end if;

  -- Downloads from the old reading lesson (e.g. the script PDF) go on lesson 1.
  select coalesce(jsonb_agg(f), '[]'::jsonb) into v_files
  from jsonb_array_elements(coalesce(v_old->'lessons', '[]'::jsonb)) l,
       jsonb_array_elements(coalesce(l->'downloads', '[]'::jsonb)) f
  where l->>'title' <> 'Anatomy of a Pitch';
  v_new := jsonb_set(v_new, '{lessons,0,downloads}', v_files);

  update public.courses
  set draft = v_new, description = 'Setter onboarding, Days 1–2: Sean''s welcome, the Anatomy of a Pitch video with a 50-question quiz, then your Day 1 recordings and Day 2 with Sean. Tick off the onboarding plan as you go.', updated_at = now()
  where id = v_course;
  raise notice 'Rebuilt the "Setter Call Training" draft. Upload Sean''s welcome video to lesson 1, preview, then publish.';
end $$;

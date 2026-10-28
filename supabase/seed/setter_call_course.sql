-- Keapr Training: "Setter Call Training", rebuilt to follow the Setter Onboarding Plan.
-- Needs migrations 0014 (reading lessons) and 0016 (task lessons).
-- One lesson per block of the plan, in its order. Task lessons end with a
-- single "I've done this" tick that unlocks the next lesson.
--   Day 1  1. 11:00 Orientation: Sean's welcome video    2. 11:00 Orientation: read script + objection sheet
--          3. 11:30 Script Reps (task)                   4. 12:30 Training Video (Anatomy of a Pitch)
--          5. 13:30 Blackout Memorisation (task)         6. 14:30 Quiz (50 questions, pass 90% = 45)
--          7. 15:30 Required Recordings (task)
--   Day 2  8. 11:00 Review   9. 12:00 Live Script Roleplay   10. 13:30 Objection Drills
--          11. 14:30 Notes & Handover   12. 15:30 Certification Roleplays   (all tasks)
-- Questions and checklist items come only from the video, the script, the
-- objection sheet, the original quiz and the onboarding plan.
--
-- Setters get the script and objection sheet separately, so the course holds
-- no copies of them: lessons are videos, the quiz, or tasks with short
-- instructions from the plan.
--
-- If the course already exists, its draft is replaced, keeping the uploaded
-- videos (Sean's welcome and Anatomy of a Pitch). Downloads are not kept.
-- Otherwise the course is created. Nothing is published:
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
   "title": "Day 1 · 11:00 · Orientation: Welcome from Sean",
   "kind": "video",
   "readingBody": "",
   "isTask": false,
   "objectives": [
    "Sean's Welcome / Role / Expectations video",
    "Your first two days: mastering one call and twelve objections",
    "Your only job: book a clean 20-minute planning call with the closer"
   ],
   "notes": "Your first two days are about one thing: mastering one call and twelve objections. You are not selling management or tech. Your only job is to book a clean 20-minute planning call with the closer.\n\nIf you follow this plan, by the end of Day 2 you'll know the script and objection sheet cold and be ready for live calls.",
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
   "key": "sc-read",
   "title": "Day 1 · 11:00 · Orientation: Read the Script and Objection Sheet",
   "kind": "reading",
   "readingBody": "# Day 1 · 11:00–11:30 · Orientation\n\n- Read the full Final Setter Script once, top to bottom.\n- Read the Objection Sheet once, top to bottom.",
   "isTask": true,
   "objectives": [
    "Read the full Final Setter Script once, top to bottom",
    "Read the Objection Sheet once, top to bottom"
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
   "key": "sc-reps",
   "title": "Day 1 · 11:30 · Script Reps",
   "kind": "reading",
   "readingBody": "# Day 1 · 11:30–12:30 · Script Reps\n\nRead the full script (sections 1–6) out loud 5 times.\n\nThen focus on:\n\n- Section 1–2 (Opener + Interest Check) – out loud 5 more times.\n- Section 4 (How it works + 4 rules + 72-night example) – out loud 5 more times.\n- Section 5 (Planning-call close + \"two times\" line) – out loud 5 more times.",
   "isTask": true,
   "objectives": [
    "Read the full script (sections 1–6) out loud 5 times",
    "Then focus on sections 1–2, 4 and 5, out loud 5 more times each"
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
   "key": "sc-pitch",
   "title": "Day 1 · 12:30 · Training Video: Anatomy of a Pitch",
   "kind": "video",
   "readingBody": "",
   "isTask": false,
   "objectives": [
    "Watch the training video once all the way through",
    "Pause and write down the four rules in your own words",
    "Pause and write down the bridge line you use after objections"
   ],
   "notes": "Watch the training video once all the way through. Pause and write down:\n\n- The four rules in your own words.\n- The bridge line you use after objections.\n\nThen take your break (13:00–13:30).",
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
   "key": "sc-blackout",
   "title": "Day 1 · 13:30 · Blackout Memorisation",
   "kind": "reading",
   "readingBody": "# Day 1 · 13:30–14:30 · Blackout Memorisation\n\nPrint the Final Setter Script twice.\n\n- On copy 1 (clean): keep as reference.\n- On copy 2 (working): read the script out loud once.\n- Black out a few words, read it again.\n- Keep blacking out more words and re-reading until you can get through sections 1–5 with most of the page blacked out.",
   "isTask": true,
   "objectives": [
    "Memorise sections 1–5 by blacking out more and more of the script"
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
   "key": "sc-quiz",
   "title": "Day 1 · 14:30 · Quiz",
   "kind": "reading",
   "readingBody": "# Day 1 · 14:30–15:30 · Quiz\n\nTake the 50-question quiz. Target: 90%+.\n\nAny question you miss:\n\n- Find that line in the script or objection sheet.\n- Read that line out loud 5 times.",
   "isTask": false,
   "objectives": [
    "Take the 50-question quiz. Target: 90%+"
   ],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 90,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 60,
   "hasQuiz": true,
   "questions": [
    {
     "key": "sc-quiz-q1",
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
     "key": "sc-quiz-q2",
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
     "key": "sc-quiz-q3",
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
     "key": "sc-quiz-q4",
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
     "key": "sc-quiz-q5",
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
     "key": "sc-quiz-q6",
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
     "key": "sc-quiz-q7",
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
     "key": "sc-quiz-q8",
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
     "key": "sc-quiz-q9",
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
     "key": "sc-quiz-q10",
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
     "key": "sc-quiz-q11",
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
     "key": "sc-quiz-q12",
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
     "key": "sc-quiz-q13",
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
     "key": "sc-quiz-q14",
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
     "key": "sc-quiz-q15",
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
     "key": "sc-quiz-q16",
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
     "key": "sc-quiz-q17",
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
     "key": "sc-quiz-q18",
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
     "key": "sc-quiz-q19",
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
     "key": "sc-quiz-q20",
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
     "key": "sc-quiz-q21",
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
     "key": "sc-quiz-q22",
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
     "key": "sc-quiz-q23",
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
     "key": "sc-quiz-q24",
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
     "key": "sc-quiz-q25",
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
     "key": "sc-quiz-q26",
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
     "key": "sc-quiz-q27",
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
     "key": "sc-quiz-q28",
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
     "key": "sc-quiz-q29",
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
     "key": "sc-quiz-q30",
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
     "key": "sc-quiz-q31",
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
     "key": "sc-quiz-q32",
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
     "key": "sc-quiz-q33",
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
     "key": "sc-quiz-q34",
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
     "key": "sc-quiz-q35",
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
     "key": "sc-quiz-q36",
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
     "key": "sc-quiz-q37",
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
     "key": "sc-quiz-q38",
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
     "key": "sc-quiz-q39",
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
     "key": "sc-quiz-q40",
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
     "key": "sc-quiz-q41",
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
     "key": "sc-quiz-q42",
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
     "key": "sc-quiz-q43",
     "prompt": "What is the target length of a setter call?",
     "options": [
      "Under 1 minute",
      "3 to 5 minutes",
      "10 to 15 minutes",
      "As long as the owner wants"
     ],
     "correctIndex": 1,
     "explanation": "The pitch is fast-paced, lasting just three to five minutes."
    },
    {
     "key": "sc-quiz-q44",
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
     "key": "sc-quiz-q45",
     "prompt": "Why should the setter never ask \"When suits you?\"",
     "options": [
      "It sounds too formal",
      "The owner will say \"I'll check and get back to you\", and they never do",
      "It takes too long",
      "The closer sets the time"
     ],
     "correctIndex": 1,
     "explanation": "Never ask \"when suits you\". Always offer two specific times."
    },
    {
     "key": "sc-quiz-q46",
     "prompt": "How should the bridge line and the two appointment times be delivered?",
     "options": [
      "Bridge, pause for the owner to respond, then offer times",
      "In a single unbroken breath, so the owner moves straight to looking at their diary",
      "Offer the times first, then the bridge",
      "Send the times by text after the call"
     ],
     "correctIndex": 1,
     "explanation": "If you pause after the bridge, you hand control back to the owner and they'll throw another objection at you."
    },
    {
     "key": "sc-quiz-q47",
     "prompt": "How long should the setter's answer to \"What's your cut?\" be?",
     "options": [
      "As long as it takes to explain fully",
      "Under 60 words",
      "Exactly three sentences",
      "One word"
     ],
     "correctIndex": 1,
     "explanation": "Never quote a percentage, paint the simple picture of commission on top, and keep the answer under 60 words."
    },
    {
     "key": "sc-quiz-q48",
     "prompt": "What does the bridge line show the owner about the setter's role?",
     "options": [
      "That the setter is the final authority on price",
      "That the setter is just the filter, not the final authority",
      "That the setter is the owner's account manager",
      "That the setter will visit the property"
     ],
     "correctIndex": 1,
     "explanation": "The bridge validates the question and hands the heavy lifting to the 20-minute call with the closer."
    },
    {
     "key": "sc-quiz-q49",
     "prompt": "What do self-managing hosts want most?",
     "options": [
      "To sell their property",
      "To fill empty midweek nights with longer stays and fewer changeovers",
      "More weekend hen parties",
      "A new cleaning team"
     ],
     "correctIndex": 1,
     "explanation": "Every guest changeover costs them time and cleaning fees. What they fear is losing control of pricing and getting locked into strict contracts."
    },
    {
     "key": "sc-quiz-q50",
     "prompt": "How does the setter describe the best case of having the planning call?",
     "options": [
      "\"You'll be fully booked all year\"",
      "\"You pick up a few extra longer bookings a year, on your terms\"",
      "\"You'll double your income\"",
      "\"We'll take over your listings\""
     ],
     "correctIndex": 1,
     "explanation": "\"Worst case, you decide you're happier as you are and we take you off the list. Best case, you pick up a few extra longer bookings a year, on your terms. Seems fair?\""
    }
   ],
   "downloads": []
  },
  {
   "key": "sc-recordings",
   "title": "Day 1 · 15:30 · Required Recordings",
   "kind": "reading",
   "readingBody": "# Day 1 · 15:30–17:00 · Required Recordings (Send by 17:00)\n\nRecord and send three videos (phone is fine):\n\n# 1. Full Script Run-Through\n\nYou reading sections 1–6 word-for-word, start to finish.\n\n# 2. Example Call Roleplay\n\nYou as Setter, imaginary Owner.\nRun a full call where the owner is an \"easy yes\" (no objections, just the core script).\n\n# 3. Objection Gauntlet\n\nYou answering objections 1, 2, 5, 11, and 12 in order.\nEach = one short answer from the sheet, then:\n\"That's exactly what [Closer Name] will run through with you properly on the planning call.\"",
   "isTask": true,
   "objectives": [
    "Record and send three videos by 17:00"
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
   "key": "sc-review",
   "title": "Day 2 · 11:00 · Review with Sean",
   "kind": "reading",
   "readingBody": "# Day 2 · Friday 11:00–17:00 (Live With Sean)\n\nObjective: Clean up delivery, pressure-test objections, and certify you on the script.\n\n# 11:00–12:00 · Review\n\nWith Sean:\n\n- Review your quiz result.\n- Watch key parts of your 3 recordings.\n\nFix:\n\n- Any wording errors in sections 1–6.\n- Pacing (3–5 minute target call length).\n- Use of the bridge line.",
   "isTask": true,
   "objectives": [
    "Clean up delivery with Sean: wording, pacing and the bridge line"
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
   "key": "sc-roleplay",
   "title": "Day 2 · 12:00 · Live Script Roleplay",
   "kind": "reading",
   "readingBody": "# Day 2 · 12:00–13:00 · Live Script Roleplay\n\nRun the full script multiple times:\n\n- 1x \"easy yes\" call.\n- 1–2x \"maybe\" calls where Sean throws in 2–3 objections (use your sheet).\n\nYou must:\n\n- Stick to the script.\n- Answer each objection once, calmly.\n- Use the bridge line and go back to booking the time.\n\nThen take your break (13:00–13:30).",
   "isTask": true,
   "objectives": [
    "Run the full script live with Sean: easy-yes and maybe calls"
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
   "key": "sc-drills",
   "title": "Day 2 · 13:30 · Objection Drills",
   "kind": "reading",
   "readingBody": "# Day 2 · 13:30–14:30 · Objection Drills\n\nRapid-fire objection practice:\nSean throws any of the 12 objections in random order.\n\nYour job: one-line answer from the sheet + bridge line, no looking down.\n\nGoal: handle all 12 confidently without the paper.",
   "isTask": true,
   "objectives": [
    "Handle all 12 objections confidently without the paper"
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
   "key": "sc-handover",
   "title": "Day 2 · 14:30 · Notes & Handover",
   "kind": "reading",
   "readingBody": "# Day 2 · 14:30–15:30 · Notes & Handover\n\nPractice writing handover notes from mock calls:\n\n- Platforms\n- Midweek situation\n- Objections raised\n- Booked time\n\nStandard: Sean can understand the owner and what to lead with in under 10 seconds of reading.",
   "isTask": true,
   "objectives": [
    "Write handover notes Sean can understand in under 10 seconds"
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
   "key": "sc-cert",
   "title": "Day 2 · 15:30 · Certification Roleplays",
   "kind": "reading",
   "readingBody": "# Day 2 · 15:30–17:00 · Certification Roleplays\n\n2–3 full calls back-to-back (including at least one polite \"not now\").\n\nIf you hit standard on:\n\n- Script accuracy,\n- Objection handling,\n- Handover notes,\n\nthen you're cleared to start live calls next week on this script.",
   "isTask": true,
   "objectives": [
    "Get certified on script accuracy, objection handling and handover notes"
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
  }
 ],
 "checklist": []
}$draft$::jsonb;
  v_pitch jsonb;
  v_welcome jsonb;
begin
  select id into v_admin from public.profiles where role = 'admin' and is_active order by created_at limit 1;
  if v_admin is null then
    raise exception 'No active admin found.';
  end if;

  select id, draft into v_course, v_old from public.courses where title = 'Setter Call Training' order by created_at limit 1;

  if v_course is null then
    insert into public.courses (title, description, is_demo, created_by, draft)
    values ('Setter Call Training', 'Setter Onboarding Plan, Days 1–2: mastering one call and twelve objections. Work through each block of the plan in order.', false, v_admin, v_new);
    raise notice 'Created "Setter Call Training" as a draft.';
    return;
  end if;

  -- Keep the uploaded training video (lesson 4) and Sean's welcome video (lesson 1), if uploaded.
  select l into v_pitch from jsonb_array_elements(coalesce(v_old->'lessons', '[]'::jsonb)) l
  where l->>'title' ilike '%Anatomy of a Pitch%' and coalesce(l->>'videoRef', '') <> '' limit 1;
  if v_pitch is not null then
    v_new := jsonb_set(v_new, '{lessons,3,videoRef}', v_pitch->'videoRef');
    v_new := jsonb_set(v_new, '{lessons,3,videoSeconds}', coalesce(v_pitch->'videoSeconds', '0'::jsonb));
  end if;
  select l into v_welcome from jsonb_array_elements(coalesce(v_old->'lessons', '[]'::jsonb)) l
  where (l->>'key' = 'sc-welcome' or l->>'title' ilike '%Welcome%') and coalesce(l->>'videoRef', '') <> '' limit 1;
  if v_welcome is not null then
    v_new := jsonb_set(v_new, '{lessons,0,videoRef}', v_welcome->'videoRef');
    v_new := jsonb_set(v_new, '{lessons,0,videoSeconds}', coalesce(v_welcome->'videoSeconds', '0'::jsonb));
  end if;

  update public.courses
  set draft = v_new, description = 'Setter Onboarding Plan, Days 1–2: mastering one call and twelve objections. Work through each block of the plan in order.', updated_at = now()
  where id = v_course;
  raise notice 'Rebuilt the "Setter Call Training" draft. Check both videos are in place (lessons 1 and 4), preview, then publish.';
end $$;

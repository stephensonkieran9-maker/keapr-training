-- Keapr Training: "Booking Hunter — Full Training Quiz" course (draft).
-- Needs migration 0014 (reading lessons).
-- One quiz lesson with all 100 questions word for word from the
-- "Booking Hunter — 100-Question Quiz Prompt" document (15 Nov 2026).
-- Nine sections; each explanation ends with its section name so learners
-- can see where they dropped marks. Pass mark 80% (80 of 100).
-- NOT published: check it with Preview as learner, then Publish and assign.
-- Safe to re-run: does nothing if a course with this title already exists.

do $$
declare
  v_admin uuid;
begin
  select id into v_admin from public.profiles where role = 'admin' and is_active order by created_at limit 1;
  if v_admin is null then
    raise exception 'No active admin found.';
  end if;
  if exists (select 1 from public.courses where title = 'Booking Hunter — Full Training Quiz') then
    raise notice 'A course called "Booking Hunter — Full Training Quiz" already exists. Nothing to do.';
    return;
  end if;

  insert into public.courses (title, description, is_demo, created_by, draft)
  values ('Booking Hunter — Full Training Quiz', 'End-of-series quiz: where leads come from, SPRINT and invoicing. 100 questions, pass mark 80/100.', false, v_admin, $draft${
 "lessons": [
  {
   "key": "bhq-l1",
   "title": "Booking Hunter — Full Training Quiz",
   "kind": "reading",
   "isTask": false,
   "readingBody": "# Booking Hunter — Full Training Quiz\n\nThis quiz covers the whole Booking Hunter training series: where leads come from, the SPRINT speed-to-lead process (Store it, Pull the database, Review Hostaway, Inform the groups, Nudge the contacts, Table the options — all inside 30 minutes) and invoicing across our three brands (Balloon Management, Red Steps, Cozy Nights).\n\n100 questions, one correct answer each. **Pass mark: 80 out of 100.**\n\nThe questions are in nine sections, in this order:\n\n- **Section 1 — Where leads come from** (questions 1–10) · rewatch: Keapr Bookings Hunter → \"Where Your Leads Come From\"\n- **Section 2 — SPRINT overview and the clock** (questions 11–20) · rewatch: SPRINT → \"The SPRINT process\"\n- **Section 3 — S: Store it** (questions 21–30) · rewatch: SPRINT → \"S – Store It\"\n- **Section 4 — P: Pull the database** (questions 31–40) · rewatch: SPRINT → \"P – Pull the Database\"\n- **Section 5 — R: Review Hostaway** (questions 41–50) · rewatch: SPRINT → \"R – Review Hostaway\"\n- **Section 6 — I: Inform the groups** (questions 51–62) · rewatch: SPRINT → \"I – Inform the Groups\"\n- **Section 7 — N: Nudge the contacts** (questions 63–74) · rewatch: SPRINT → \"N – Nudge the Contacts\"\n- **Section 8 — T: Table the options** (questions 75–86) · rewatch: SPRINT → \"T – Table the Options\"\n- **Section 9 — Invoicing** (questions 87–100) · rewatch: Invoicing → \"Raising invoices\"\n\nAfter you submit, each explanation shows which section the question came from. If you drop marks in a section, rewatch the lesson listed next to it before you retry.",
   "objectives": [
    "Take the 100-question Booking Hunter quiz. Pass mark: 80/100"
   ],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 80,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 60,
   "hasQuiz": true,
   "questions": [
    {
     "key": "bhq-q1",
     "prompt": "How many \"buckets\" do our leads come from?",
     "options": [
      "Two",
      "Three",
      "Five",
      "Thirty"
     ],
     "correctIndex": 1,
     "explanation": "Platforms and partners, existing guests, community groups. (Section 1 — Where leads come from)"
    },
    {
     "key": "bhq-q2",
     "prompt": "Which of these is NOT one of the three buckets?",
     "options": [
      "Platforms and partners",
      "Existing guests",
      "Community groups",
      "Cold calling"
     ],
     "correctIndex": 3,
     "explanation": "We don't cold-call for leads; every lead comes through one of the three doors. (Section 1 — Where leads come from)"
    },
    {
     "key": "bhq-q3",
     "prompt": "Which bucket is the biggest by volume?",
     "options": [
      "Existing guests",
      "Community groups",
      "Platforms and partners",
      "Referrals"
     ],
     "correctIndex": 2,
     "explanation": "Thirty-odd platforms and partner sites send us enquiries every day. (Section 1 — Where leads come from)"
    },
    {
     "key": "bhq-q4",
     "prompt": "A guest in one of our properties wants to extend by two weeks, but the property is booked after them. What's the right response?",
     "options": [
      "\"Sorry, it's not available\"",
      "\"Leave it with me\" — then find them somewhere else in the network, ideally nearby",
      "Suggest a hotel",
      "Tell them to check Airbnb"
     ],
     "correctIndex": 1,
     "explanation": "An existing guest asking for more is the warmest lead you'll ever get. (Section 1 — Where leads come from)"
    },
    {
     "key": "bhq-q5",
     "prompt": "Which of these is a contractor-focused platform?",
     "options": [
      "Silverdoor",
      "Contractor Stop",
      "Blueground",
      "The Square"
     ],
     "correctIndex": 1,
     "explanation": "Contractor Stop, Comfy Workers, Snooze for Staff and Stay for Work send working crews, usually Mon–Fri for weeks. (Section 1 — Where leads come from)"
    },
    {
     "key": "bhq-q6",
     "prompt": "Which of these is a corporate / serviced-apartment agent?",
     "options": [
      "Snooze for Staff",
      "Comfy Workers",
      "Silverdoor",
      "Stay for Work"
     ],
     "correctIndex": 2,
     "explanation": "Silverdoor, The Square, Blueground and Urban Stay place company staff on longer stays with bigger budgets. (Section 1 — Where leads come from)"
    },
    {
     "key": "bhq-q7",
     "prompt": "A guest's project moves from Derby to Leeds. We have nothing in Leeds. What is this?",
     "options": [
      "Not our problem",
      "A lead — log it and place it",
      "A referral to another provider",
      "A cancellation"
     ],
     "correctIndex": 1,
     "explanation": "Same company, same crew, new city. They want us to sort it. That's a lead. (Section 1 — Where leads come from)"
    },
    {
     "key": "bhq-q8",
     "prompt": "In the WhatsApp groups you're doing two jobs at once. What are they?",
     "options": [
      "Posting adverts and replying to reviews",
      "Hunting for owners to place our leads, and hunting for leads to place with our owners",
      "Chasing invoices and confirming cleans",
      "Reading and lurking"
     ],
     "correctIndex": 1,
     "explanation": "The groups work both ways. Keep your eyes on both. (Section 1 — Where leads come from)"
    },
    {
     "key": "bhq-q9",
     "prompt": "Someone posts \"Anyone got a 4-bed near Swindon from the 3rd?\" in a group. What do you do?",
     "options": [
      "Ignore it — it wasn't sent to us",
      "Reply in the group with a price",
      "Reply, take it to DM, qualify it, log it in Notion, and go find a property",
      "Forward it to the bookings manager and wait"
     ],
     "correctIndex": 2,
     "explanation": "Nobody sent it to us; it's there for whoever moves first. You move first. (Section 1 — Where leads come from)"
    },
    {
     "key": "bhq-q10",
     "prompt": "Why does the lead source have to be logged correctly every time?",
     "options": [
      "So Notion looks tidy",
      "So we know which channels are worth the most",
      "The platforms require it",
      "It doesn't matter as long as the lead is logged"
     ],
     "correctIndex": 1,
     "explanation": "Platform name, existing guest, WhatsApp group, Facebook group — every time. (Section 1 — Where leads come from)"
    },
    {
     "key": "bhq-q11",
     "prompt": "What does SPRINT stand for?",
     "options": [
      "Search, Post, Review, Inform, Negotiate, Transfer",
      "Store, Pull, Review, Inform, Nudge, Table",
      "Store, Post, Reply, Invoice, Nudge, Track",
      "It isn't an acronym"
     ],
     "correctIndex": 1,
     "explanation": "Store it, Pull the database, Review Hostaway, Inform the groups, Nudge the contacts, Table the options. (Section 2 — SPRINT overview and the clock)"
    },
    {
     "key": "bhq-q12",
     "prompt": "What's the target from the lead landing to the client having options?",
     "options": [
      "2 hours",
      "1 hour",
      "30 minutes",
      "End of the working day"
     ],
     "correctIndex": 2,
     "explanation": "The whole sprint is 30 minutes. (Section 2 — SPRINT overview and the clock)"
    },
    {
     "key": "bhq-q13",
     "prompt": "Target for S — Store it, from the lead landing?",
     "options": [
      "2 minutes",
      "5 minutes",
      "10 minutes",
      "15 minutes"
     ],
     "correctIndex": 0,
     "explanation": "Two minutes to get the lead into Notion. (Section 2 — SPRINT overview and the clock)"
    },
    {
     "key": "bhq-q14",
     "prompt": "Target for P — Pull the database?",
     "options": [
      "5 minutes",
      "8 minutes",
      "12 minutes",
      "15 minutes"
     ],
     "correctIndex": 1,
     "explanation": "Eight minutes from the lead landing, so about six minutes for the search itself. (Section 2 — SPRINT overview and the clock)"
    },
    {
     "key": "bhq-q15",
     "prompt": "Target for R — Review Hostaway?",
     "options": [
      "8 minutes",
      "10 minutes",
      "12 minutes",
      "20 minutes"
     ],
     "correctIndex": 2,
     "explanation": "Twelve minutes. (Section 2 — SPRINT overview and the clock)"
    },
    {
     "key": "bhq-q16",
     "prompt": "Target for I — Inform the groups?",
     "options": [
      "10 minutes",
      "12 minutes",
      "15 minutes",
      "25 minutes"
     ],
     "correctIndex": 2,
     "explanation": "Fifteen minutes. The first four steps are mostly laptop work, no one to wait for. (Section 2 — SPRINT overview and the clock)"
    },
    {
     "key": "bhq-q17",
     "prompt": "Target for N — Nudge the contacts?",
     "options": [
      "15 minutes",
      "20 minutes",
      "25 minutes",
      "30 minutes"
     ],
     "correctIndex": 2,
     "explanation": "Twenty-five minutes, leaving five to write up and table. (Section 2 — SPRINT overview and the clock)"
    },
    {
     "key": "bhq-q18",
     "prompt": "Why do P and R come before I?",
     "options": [
      "The WhatsApp groups are slow to reply",
      "You want to know what we've already got before you ask the wider network",
      "Notion won't let you tick I first",
      "The order doesn't matter"
     ],
     "correctIndex": 1,
     "explanation": "Own stock and owner database first, then the network. (Section 2 — SPRINT overview and the clock)"
    },
    {
     "key": "bhq-q19",
     "prompt": "A lead lands at 9pm. What happens?",
     "options": [
      "Run the whole sprint tonight",
      "Log it tonight (S), and the rest starts first thing in the morning with the clock reset",
      "Leave all of it until morning",
      "Reply tonight, log it in the morning"
     ],
     "correctIndex": 1,
     "explanation": "Log it, always. The sprint runs in working hours. (Section 2 — SPRINT overview and the clock)"
    },
    {
     "key": "bhq-q20",
     "prompt": "You hit 30 minutes with one confirmed option, not three. What do you do?",
     "options": [
      "Keep going until you have three",
      "Go back to the client with the one and say the rest are coming",
      "Wait until tomorrow and send all three",
      "Ask the bookings manager to extend the clock"
     ],
     "correctIndex": 1,
     "explanation": "One real option inside 30 minutes beats three this afternoon. (Section 2 — SPRINT overview and the clock)"
    },
    {
     "key": "bhq-q21",
     "prompt": "A lead comes in by email. What's the very first thing you do?",
     "options": [
      "Reply so the client knows we've seen it",
      "Search the property finder",
      "Log it in Notion and tick S",
      "Message the bookings manager"
     ],
     "correctIndex": 2,
     "explanation": "Nothing happens until the lead has a card. Log first, then reply. (Section 3 — S: Store it)"
    },
    {
     "key": "bhq-q22",
     "prompt": "What is the Notion board called?",
     "options": [
      "Guest/Owner Services",
      "SPRINT – External Offers",
      "SPRINT – Leads",
      "Bookings Pipeline"
     ],
     "correctIndex": 1,
     "explanation": "SPRINT – External Offers, under Guest/Owner Services. (Section 3 — S: Store it)"
    },
    {
     "key": "bhq-q23",
     "prompt": "How do you name a new lead card?",
     "options": [
      "The client's company name",
      "Today's date",
      "SPRINT – [area]/[source], e.g. SPRINT – Ipswich/SQ",
      "Your own name"
     ],
     "correctIndex": 2,
     "explanation": "Same format every time so the board is scannable. (Section 3 — S: Store it)"
    },
    {
     "key": "bhq-q24",
     "prompt": "You've got dates, area and headcount but no budget. What goes in Budget (total)?",
     "options": [
      "A sensible estimate",
      "Nothing — leave it empty and keep going",
      "\"TBC\"",
      "Don't save the card until you've asked"
     ],
     "correctIndex": 1,
     "explanation": "Fill what you have, never guess, never delay logging. (Section 3 — S: Store it)"
    },
    {
     "key": "bhq-q25",
     "prompt": "Where do the client's contact name, phone and email go?",
     "options": [
      "The card title",
      "The Lead source property",
      "At the top of Notes",
      "In your own email, not Notion"
     ],
     "correctIndex": 2,
     "explanation": "Contact details first in Notes; you'll need them at step N. (Section 3 — S: Store it)"
    },
    {
     "key": "bhq-q26",
     "prompt": "What status does a brand-new card get, and what do you tick?",
     "options": [
      "Searching, tick P",
      "New lead, tick S – Stored in Notion",
      "New lead, tick nothing yet",
      "Offers found, tick S"
     ],
     "correctIndex": 1,
     "explanation": "Status New lead, tick S. That starts the clock. (Section 3 — S: Store it)"
    },
    {
     "key": "bhq-q27",
     "prompt": "What does the Last update timestamp give you?",
     "options": [
      "When the client last emailed",
      "The start of your 30-minute clock",
      "The check-in date",
      "Nothing — it's automatic"
     ],
     "correctIndex": 1,
     "explanation": "Notion stamps it when the card is saved; that's the clock. (Section 3 — S: Store it)"
    },
    {
     "key": "bhq-q28",
     "prompt": "Every lead has two sets of checkboxes. What's the second set?",
     "options": [
      "The six SPRINT steps",
      "Where you searched — Manus, Hostaway, WhatsApp, Facebook, Airbnb, Booking.com",
      "The client's requirements",
      "The bookings manager's approvals"
     ],
     "correctIndex": 1,
     "explanation": "The SPRINT steps are set one; the search boxes are set two. Every box gets ticked on every lead. (Section 3 — S: Store it)"
    },
    {
     "key": "bhq-q29",
     "prompt": "When do you move a card from New lead to Searching?",
     "options": [
      "When the first option is confirmed",
      "The moment you start step P",
      "When the options are sent",
      "When the bookings manager says so"
     ],
     "correctIndex": 1,
     "explanation": "Drag it to Searching as soon as you start searching. (Section 3 — S: Store it)"
    },
    {
     "key": "bhq-q30",
     "prompt": "Who owns the sprint on a lead?",
     "options": [
      "The bookings manager, always",
      "Whoever logged it, until the bookings manager reassigns it",
      "Whoever is free",
      "Nobody — it's a team card"
     ],
     "correctIndex": 1,
     "explanation": "Assigned to: you. Whoever logs it owns it unless told otherwise. (Section 3 — S: Store it)"
    },
    {
     "key": "bhq-q31",
     "prompt": "What is the property finder built on?",
     "options": [
      "Hostaway",
      "Notion",
      "Manus",
      "Airbnb"
     ],
     "correctIndex": 2,
     "explanation": "It's a Manus AI app connected to our data. (Section 4 — P: Pull the database)"
    },
    {
     "key": "bhq-q32",
     "prompt": "What two sources does the property finder search?",
     "options": [
      "Airbnb and Booking.com",
      "The Notion owner database and our Hostaway account",
      "The WhatsApp and Facebook groups",
      "Google and Rightmove"
     ],
     "correctIndex": 1,
     "explanation": "Thousands of partner owners plus our own managed properties, in one search. (Section 4 — P: Pull the database)"
    },
    {
     "key": "bhq-q33",
     "prompt": "What should you type into Location whenever you have it?",
     "options": [
      "The county",
      "The nearest city",
      "The site postcode",
      "The client's company name"
     ],
     "correctIndex": 2,
     "explanation": "Postcode is granular; distances come back from the exact spot. (Section 4 — P: Pull the database)"
    },
    {
     "key": "bhq-q34",
     "prompt": "Why does the Brand selector (Cozy Nights / Red Steps) matter?",
     "options": [
      "It changes which properties are shown",
      "It changes the messaging the tool generates later",
      "It's only for reporting",
      "It doesn't — pick either"
     ],
     "correctIndex": 1,
     "explanation": "Pick the brand the lead came in under. (Section 4 — P: Pull the database)"
    },
    {
     "key": "bhq-q35",
     "prompt": "What does a purple \"Managed\" badge mean?",
     "options": [
      "Managed by a partner agency",
      "A property we run ourselves through Hostaway",
      "The owner has already been contacted",
      "The property is fully booked"
     ],
     "correctIndex": 1,
     "explanation": "Managed = our own portfolio. Partner (teal) = an owner from the database. (Section 4 — P: Pull the database)"
    },
    {
     "key": "bhq-q36",
     "prompt": "What does a Partner card show that a Managed card doesn't?",
     "options": [
      "The 28-night price",
      "The owner's name, phone and email, and parking",
      "The listing photos",
      "The review score"
     ],
     "correctIndex": 1,
     "explanation": "Partner cards carry the owner's contact details for step N. (Section 4 — P: Pull the database)"
    },
    {
     "key": "bhq-q37",
     "prompt": "What does a Managed card show that a Partner card doesn't?",
     "options": [
      "The owner's phone number",
      "The 28-night total and per-night rate, calculated from your dates",
      "The WhatsApp button",
      "The distance from site"
     ],
     "correctIndex": 1,
     "explanation": "Managed pricing is auto-calculated from the dates you entered. (Section 4 — P: Pull the database)"
    },
    {
     "key": "bhq-q38",
     "prompt": "How many properties should be on your shortlist?",
     "options": [
      "One — the closest",
      "Three to five",
      "All twenty",
      "Only managed ones"
     ],
     "correctIndex": 1,
     "explanation": "Owners drop out and clients want a choice. (Section 4 — P: Pull the database)"
    },
    {
     "key": "bhq-q39",
     "prompt": "What is the map view for?",
     "options": [
      "Checking parking",
      "Sanity-checking real drive time, not just miles as the crow flies",
      "Booking the property",
      "Seeing photos"
     ],
     "correctIndex": 1,
     "explanation": "15 miles can be a 40-minute drive on the wrong side of an estuary. Inside 20– 30 minutes is in play. (Section 4 — P: Pull the database)"
    },
    {
     "key": "bhq-q40",
     "prompt": "The WhatsApp Message Generator at the bottom of the page — what is it for and when do you use it?",
     "options": [
      "Messaging owners in step P",
      "Posting in the groups in step I",
      "A branded message with the listing link for the client, used in step T",
      "Logging the lead in Notion"
     ],
     "correctIndex": 2,
     "explanation": "It's guest-facing. Know it's there; come back to it when tabling options. (Section 4 — P: Pull the database)"
    },
    {
     "key": "bhq-q41",
     "prompt": "The property finder is already connected to Hostaway. Why check Hostaway by hand?",
     "options": [
      "The finder doesn't show managed properties",
      "The sync isn't live to the minute — a recent cancellation or new block won't show in the finder yet",
      "Hostaway has better photos",
      "You don't need to"
     ],
     "correctIndex": 1,
     "explanation": "The finder says a property exists; Hostaway says whether it's free right now. A second lock on the door. (Section 5 — R: Review Hostaway)"
    },
    {
     "key": "bhq-q42",
     "prompt": "Which Hostaway view do you use to check availability across properties?",
     "options": [
      "Reservations",
      "Listings",
      "Calendar → Multi",
      "Inbox"
     ],
     "correctIndex": 2,
     "explanation": "The Multi calendar shows every listing down the left and the dates across the top. (Section 5 — R: Review Hostaway)"
    },
    {
     "key": "bhq-q43",
     "prompt": "What does a teal or orange bar across a row mean?",
     "options": [
      "Available",
      "Booked for those dates",
      "Blocked by ops",
      "Price changed"
     ],
     "correctIndex": 1,
     "explanation": "Coloured bars are bookings. Teal is direct/Hostaway, orange is Airbnb. Those dates are gone. (Section 5 — R: Review Hostaway)"
    },
    {
     "key": "bhq-q44",
     "prompt": "What does a grey bar labelled \"Blocked as per owner\" or \"Pest control\" mean, and what do you do?",
     "options": [
      "It's booked — move on",
      "It's a block, not a booking — ask ops whether it can move before ruling the property out",
      "The listing has been removed",
      "It's free — ignore the label"
     ],
     "correctIndex": 1,
     "explanation": "A block can sometimes move; a booking never can. (Section 5 — R: Review Hostaway)"
    },
    {
     "key": "bhq-q45",
     "prompt": "What does a price in an empty calendar cell tell you?",
     "options": [
      "The cleaning fee",
      "The total for the stay",
      "That night is available, at that nightly rate",
      "A competitor's price"
     ],
     "correctIndex": 2,
     "explanation": "A run of prices with no bars across the client's dates is what you're looking for. (Section 5 — R: Review Hostaway)"
    },
    {
     "key": "bhq-q46",
     "prompt": "Quickest way to cut the Multi calendar down to one area?",
     "options": [
      "Scroll through all 66 listings",
      "Type the town into Search by listing",
      "Open each listing one by one",
      "Export to a spreadsheet"
     ],
     "correctIndex": 1,
     "explanation": "Search by listing, or the City dropdown or Tags. (Section 5 — R: Review Hostaway)"
    },
    {
     "key": "bhq-q47",
     "prompt": "Which two Show toggles need to be on so you see bookings?",
     "options": [
      "Tags and Country",
      "Reservations and Notes",
      "Available listings and All units",
      "Monthly and Yearly"
     ],
     "correctIndex": 1,
     "explanation": "With Reservations off you won't see the bars. (Section 5 — R: Review Hostaway)"
    },
    {
     "key": "bhq-q48",
     "prompt": "The calendar shows the property is free. What's next?",
     "options": [
      "Nothing — a free calendar is enough",
      "Open the listing page to confirm guests, bedrooms, beds, parking and fees",
      "Phone the owner",
      "Post in the groups"
     ],
     "correctIndex": 1,
     "explanation": "Free isn't the same as fits the brief. (Section 5 — R: Review Hostaway)"
    },
    {
     "key": "bhq-q49",
     "prompt": "For a workforce group, which three numbers on the listing page matter most?",
     "options": [
      "Listing ID, status, channels",
      "Guests, bedrooms, beds",
      "Rating, reviews, response rate",
      "Check-in time, check-out time, cancellation policy"
     ],
     "correctIndex": 1,
     "explanation": "Eight guests, four bedrooms, five beds means a bed each and nobody on a sofa. (Section 5 — R: Review Hostaway)"
    },
    {
     "key": "bhq-q50",
     "prompt": "What price do you put against a Hostaway match in Notion?",
     "options": [
      "Nightly rate only",
      "Nightly rate plus the cleaning fee and any other fees on the listing",
      "The Airbnb price",
      "Whatever the property finder showed"
     ],
     "correctIndex": 1,
     "explanation": "The figure that goes to the client at T is the whole cost. (Section 5 — R: Review Hostaway)"
    },
    {
     "key": "bhq-q51",
     "prompt": "What is the WhatsApp community we post requirements in called?",
     "options": [
      "SA Operators UK",
      "The Direct Booking Exchange",
      "Contractor Stays Network",
      "Booking Hunters"
     ],
     "correctIndex": 1,
     "explanation": "Split into regional groups plus General SA Chat. (Section 6 — I: Inform the groups)"
    },
    {
     "key": "bhq-q52",
     "prompt": "The Notion card says the lead source is WhatsApp. What do you do at step I?",
     "options": [
      "Post it in a different regional group",
      "Reword it and post it in the same group",
      "Skip the post, write \"Lead came via WhatsApp — not posted\" in Notes, tick I",
      "Post it in General SA Chat only"
     ],
     "correctIndex": 2,
     "explanation": "WhatsApp in, never WhatsApp out. (Section 6 — I: Inform the groups)"
    },
    {
     "key": "bhq-q53",
     "prompt": "Why does a WhatsApp-sourced lead never go back into WhatsApp?",
     "options": [
      "WhatsApp blocks duplicate posts",
      "The operator who posted it is in these groups and would see us shopping their client round",
      "It would confuse the bookings manager",
      "There's no reason — it's just a preference"
     ],
     "correctIndex": 1,
     "explanation": "We'd lose them, and probably the people they talk to. (Section 6 — I: Inform the groups)"
    },
    {
     "key": "bhq-q54",
     "prompt": "Which of these must never appear in a group post?",
     "options": [
      "Number of guests",
      "The dates",
      "The client's name, company, site or project",
      "The town"
     ],
     "correctIndex": 2,
     "explanation": "The requirement is public; the client is not. (Section 6 — I: Inform the groups)"
    },
    {
     "key": "bhq-q55",
     "prompt": "What level of postcode goes in the post?",
     "options": [
      "The full postcode",
      "The postcode district, e.g. IP2",
      "No postcode at all",
      "The client's head-office postcode"
     ],
     "correctIndex": 1,
     "explanation": "Full postcode plus dates plus headcount identifies the job. (Section 6 — I: Inform the groups)"
    },
    {
     "key": "bhq-q56",
     "prompt": "The client's site is in Ipswich. Which group?",
     "options": [
      "London",
      "Midlands",
      "East of England",
      "General SA Chat"
     ],
     "correctIndex": 2,
     "explanation": "Ipswich is East of England. If you're not certain of a region, look it up before posting. (Section 6 — I: Inform the groups)"
    },
    {
     "key": "bhq-q57",
     "prompt": "How many times do you check you're in the right regional group?",
     "options": [
      "Once",
      "Twice",
      "Three times — when you open it, when you've written the post, before you hit send",
      "You don't — post in all of them"
     ],
     "correctIndex": 2,
     "explanation": "Wrong group then re-post looks sloppy and doubles the client's exposure. (Section 6 — I: Inform the groups)"
    },
    {
     "key": "bhq-q58",
     "prompt": "What's the header line on every post?",
     "options": [
      "BOOKING REQUEST",
      "ACCOMMODATION NEEDED",
      "The client's name",
      "No header"
     ],
     "correctIndex": 1,
     "explanation": "People scanning the group spot a requirement in half a second. (Section 6 — I: Inform the groups)"
    },
    {
     "key": "bhq-q59",
     "prompt": "The client hasn't said whether they need parking. What goes on the Parking line?",
     "options": [
      "Delete the line",
      "\"Yes\"",
      "\"Flexible\"",
      "Leave it blank"
     ],
     "correctIndex": 2,
     "explanation": "Fill every line; people reply to posts that answer their questions up front. (Section 6 — I: Inform the groups)"
    },
    {
     "key": "bhq-q60",
     "prompt": "How should people respond to your post?",
     "options": [
      "Reply in the group",
      "DM you",
      "Phone the office",
      "Email"
     ],
     "correctIndex": 1,
     "explanation": "Replies in the group are visible to every competitor. DMs keep the deal ours. (Section 6 — I: Inform the groups)"
    },
    {
     "key": "bhq-q61",
     "prompt": "When do you tick Posted on WhatsApp and I?",
     "options": [
      "When the first reply arrives",
      "When the lead is booked",
      "The moment the post is up",
      "End of the day"
     ],
     "correctIndex": 2,
     "explanation": "Tick as soon as it's live; don't wait for replies. (Section 6 — I: Inform the groups)"
    },
    {
     "key": "bhq-q62",
     "prompt": "The lead is sorted. What do you do with your post?",
     "options": [
      "Delete it",
      "Reply to it: \"Sorted, thanks all\"",
      "Nothing",
      "Post the winning property's details"
     ],
     "correctIndex": 1,
     "explanation": "Close the loop. People reply faster next time to someone who does. (Section 6 — I: Inform the groups)"
    },
    {
     "key": "bhq-q63",
     "prompt": "Who do you contact in step N?",
     "options": [
      "The three best-looking properties",
      "Only managed properties",
      "Everyone who matched in the database and everyone who replied to the group post",
      "Only group replies"
     ],
     "correctIndex": 2,
     "explanation": "Everyone, in one pass. Nobody is worth anything until they've confirmed. (Section 7 — N: Nudge the contacts)"
    },
    {
     "key": "bhq-q64",
     "prompt": "There's a managed Hostaway property on your list. Who do you contact about it?",
     "options": [
      "The owner",
      "The bookings manager — to confirm it's ours to offer and at what rate",
      "The cleaner",
      "Nobody — managed is automatically confirmed"
     ],
     "correctIndex": 1,
     "explanation": "Managed stock is a message to the bookings manager, not an owner call. (Section 7 — N: Nudge the contacts)"
    },
    {
     "key": "bhq-q65",
     "prompt": "What's the first way you contact every owner?",
     "options": [
      "WhatsApp",
      "Email",
      "Phone",
      "Whichever they prefer"
     ],
     "correctIndex": 2,
     "explanation": "Phone first, always. A call gets everything in two minutes. (Section 7 — N: Nudge the contacts)"
    },
    {
     "key": "bhq-q66",
     "prompt": "You phone an owner and they don't answer. What do you do?",
     "options": [
      "Leave a voicemail and wait",
      "Message them immediately, then dial the next contact",
      "Try again straight away",
      "Skip them"
     ],
     "correctIndex": 1,
     "explanation": "WhatsApp or email while the phone's still in your hand, then keep moving. (Section 7 — N: Nudge the contacts)"
    },
    {
     "key": "bhq-q67",
     "prompt": "How long after a missed call do you call the same owner again?",
     "options": [
      "5 minutes",
      "30 minutes",
      "Next morning",
      "You don't"
     ],
     "correctIndex": 1,
     "explanation": "Two missed calls and a message means they'll see you. Set a reminder. (Section 7 — N: Nudge the contacts)"
    },
    {
     "key": "bhq-q68",
     "prompt": "An owner replies on WhatsApp instead of calling back. First message?",
     "options": [
      "\"What's your price?\"",
      "\"Is it okay to give you a quick call now?\"",
      "\"Can you send photos?\"",
      "\"Is it available?\""
     ],
     "correctIndex": 1,
     "explanation": "Ask to call every time. If they say no, collect everything by message. (Section 7 — N: Nudge the contacts)"
    },
    {
     "key": "bhq-q69",
     "prompt": "An owner says \"yes, it's available.\" What status goes in Notion?",
     "options": [
      "Confirmed",
      "WA replied — collecting, then keep asking until every checklist item is answered",
      "Booked",
      "Waiting"
     ],
     "correctIndex": 1,
     "explanation": "\"Available\" is the start of the conversation, not the end. (Section 7 — N: Nudge the contacts)"
    },
    {
     "key": "bhq-q70",
     "prompt": "The owner gives you a nightly rate. What's the next question?",
     "options": [
      "\"Can you do it cheaper?\"",
      "\"Does that include cleaning — and linen, bills, any mid-stay clean?\"",
      "\"What's the Airbnb price?\"",
      "None — a rate is enough"
     ],
     "correctIndex": 1,
     "explanation": "The number you give the client is the whole cost. (Section 7 — N: Nudge the contacts)"
    },
    {
     "key": "bhq-q71",
     "prompt": "The client needs parking for two vans. How do you ask the owner?",
     "options": [
      "\"Does it have parking?\"",
      "\"Is parking nearby?\"",
      "\"The client's got two vans — can both park on the drive?\"",
      "You don't need to — the listing says parking: yes"
     ],
     "correctIndex": 2,
     "explanation": "Specific questions get specific answers. Vague answers blow up later. (Section 7 — N: Nudge the contacts)"
    },
    {
     "key": "bhq-q72",
     "prompt": "Price is perfect and dates are free, but the owner can't meet a requirement the client said was non-negotiable. What do you do?",
     "options": [
      "Table it anyway — the price might win them over",
      "Mark them as a no, note why, move on",
      "Ask the client to drop the requirement",
      "Mark as Confirmed"
     ],
     "correctIndex": 1,
     "explanation": "Don't offer a property hoping the client will bend. (Section 7 — N: Nudge the contacts)"
    },
    {
     "key": "bhq-q73",
     "prompt": "What does the status \"Waiting — [what for, by when]\" mean?",
     "options": [
      "You're waiting for the client",
      "The owner has gone to check something and will come back; you've noted what and when",
      "The bookings manager hasn't replied",
      "The property is on hold"
     ],
     "correctIndex": 1,
     "explanation": "Same words every time so anyone can read the card. (Section 7 — N: Nudge the contacts)"
    },
    {
     "key": "bhq-q74",
     "prompt": "When do you tick N?",
     "options": [
      "When every owner has replied",
      "When all 30-minute callbacks are done",
      "When the first full pass is done — everyone phoned once, messaged if no answer",
      "When the client has chosen"
     ],
     "correctIndex": 2,
     "explanation": "Replies and second calls keep coming after N is ticked. (Section 7 — N: Nudge the contacts)"
    },
    {
     "key": "bhq-q75",
     "prompt": "For now, who do you table the options to?",
     "options": [
      "Straight to the client",
      "The bookings manager, who presents them to the client",
      "The owner",
      "The WhatsApp group"
     ],
     "correctIndex": 1,
     "explanation": "Every lead goes to the bookings manager first until you've run a few cleanly. (Section 8 — T: Table the options)"
    },
    {
     "key": "bhq-q76",
     "prompt": "What's the test for whether an option is properly tabled?",
     "options": [
      "The owner has confirmed availability",
      "The bookings manager could send it to the client without asking you a single question",
      "It's under budget",
      "It's on Airbnb"
     ],
     "correctIndex": 1,
     "explanation": "If he has to ask \"what are the reviews on Booking.com?\", it isn't tabled. (Section 8 — T: Table the options)"
    },
    {
     "key": "bhq-q77",
     "prompt": "An owner came from the database. Where's their first platform link?",
     "options": [
      "Google",
      "The OTA button on their card in the property finder",
      "Ask the bookings manager",
      "The WhatsApp group"
     ],
     "correctIndex": 1,
     "explanation": "From there, find the other platform. (Section 8 — T: Table the options)"
    },
    {
     "key": "bhq-q78",
     "prompt": "You have the Airbnb link but can't find the property on Booking.com. What do you do?",
     "options": [
      "Skip it — one platform is enough",
      "Search name, street and town on Booking.com, match the photos, and ask the owner if still nothing",
      "Mark the property as a no",
      "Assume it's not there"
     ],
     "correctIndex": 1,
     "explanation": "Nearly every owner is on both. Ask them for the link if you can't find it. (Section 8 — T: Table the options)"
    },
    {
     "key": "bhq-q79",
     "prompt": "The owner is on neither Airbnb nor Booking.com. What does that mean?",
     "options": [
      "Automatic no",
      "Not automatically a no — but it goes on the write-up as \"no platform presence\" so the bookings manager knows there's nothing to check",
      "Automatic yes — direct bookers are the best",
      "Skip the reviews step"
     ],
     "correctIndex": 1,
     "explanation": "Some good owners only do direct, but it must be flagged. (Section 8 — T: Table the options)"
    },
    {
     "key": "bhq-q80",
     "prompt": "A property is 4.9 on Airbnb with 12 reviews and 6.1 on Booking.com with 80. What does that tell you?",
     "options": [
      "Great property — the Airbnb score proves it",
      "The Booking.com score is probably the truer picture for a contractor group, and the mismatch must be flagged",
      "Ignore both",
      "Average the two"
     ],
     "correctIndex": 1,
     "explanation": "Working guests on Booking.com are blunt and stay longer. Different guests, different story. (Section 8 — T: Table the options)"
    },
    {
     "key": "bhq-q81",
     "prompt": "Which reviews should you read most closely?",
     "options": [
      "The oldest",
      "The five-star ones",
      "The most recent five or six, and anything that comes up more than once",
      "Only the score"
     ],
     "correctIndex": 2,
     "explanation": "Great two years ago and three complaints this month is not great. Repeated issues hit us at week two. (Section 8 — T: Table the options)"
    },
    {
     "key": "bhq-q82",
     "prompt": "Reviews are bad on both platforms but the price is perfect. What do you do?",
     "options": [
      "Table it — the client can decide",
      "Table it as option 3",
      "It's a no — note why and leave it out",
      "Ask the owner to explain"
     ],
     "correctIndex": 2,
     "explanation": "We'd rather lose a booking than win one that loses us a client. (Section 8 — T: Table the options)"
    },
    {
     "key": "bhq-q83",
     "prompt": "How many options do you present, and in what order?",
     "options": [
      "All of them, cheapest first",
      "One",
      "Three, your recommendation first with one line on why",
      "Five, closest first"
     ],
     "correctIndex": 2,
     "explanation": "The bookings manager wants your judgement, not a menu. (Section 8 — T: Table the options)"
    },
    {
     "key": "bhq-q84",
     "prompt": "What must the Rate line in the write-up include?",
     "options": [
      "Nightly rate only",
      "Nightly rate, total for the stay, and what's included or extra",
      "The Airbnb price",
      "\"Best rates\""
     ],
     "correctIndex": 1,
     "explanation": "The figure that goes to the client is the whole cost. (Section 8 — T: Table the options)"
    },
    {
     "key": "bhq-q85",
     "prompt": "The write-up is done. What are the next three actions?",
     "options": [
      "Send it to the client, tick T, close the card",
      "Message the bookings manager, move status to Offers found, tick T",
      "Post in the groups, tick T, wait",
      "Phone the owners again"
     ],
     "correctIndex": 1,
     "explanation": "Offer sent comes when the bookings manager has sent them on. (Section 8 — T: Table the options)"
    },
    {
     "key": "bhq-q86",
     "prompt": "The bookings manager asks something about an option you can't answer. What is that?",
     "options": [
      "His problem",
      "A gap in your write-up — fill it, and bring it back with the rest next time",
      "Normal — he always has questions",
      "A reason to drop the option"
     ],
     "correctIndex": 1,
     "explanation": "Expect questions, but every one is a gap to close. (Section 8 — T: Table the options)"
    },
    {
     "key": "bhq-q87",
     "prompt": "Which three brands do we invoice under?",
     "options": [
      "Keapr, Red Steps, Sono",
      "Balloon Management, Red Steps, Cozy Nights",
      "Balloon Management, Keapr, Fenchurch",
      "Red Steps, Cozy Nights, Gold Property Group"
     ],
     "correctIndex": 1,
     "explanation": "Each has its own template with its own company, bank details and VAT treatment. (Section 9 — Invoicing)"
    },
    {
     "key": "bhq-q88",
     "prompt": "Who decides which brand, which company and whether VAT applies?",
     "options": [
      "The agent, from the client type",
      "The bookings manager, in writing, before you start",
      "The client",
      "Whoever is on shift"
     ],
     "correctIndex": 1,
     "explanation": "Three answers, in writing, before you open a template. (Section 9 — Invoicing)"
    },
    {
     "key": "bhq-q89",
     "prompt": "You've been given a booking to invoice but haven't got those three answers. What do you do?",
     "options": [
      "Use the brand the lead came in under",
      "Don't start — ask, and wait for the reply",
      "Build it on Balloon and change it later",
      "Build all three and let the bookings manager pick"
     ],
     "correctIndex": 1,
     "explanation": "Two minutes of asking saves an hour of redoing it. (Section 9 — Invoicing)"
    },
    {
     "key": "bhq-q90",
     "prompt": "Which brand's template carries a \"VAT @ 20% included\" line and a VAT registration number in the footer?",
     "options": [
      "Red Steps",
      "Cozy Nights",
      "Balloon Management",
      "All three"
     ],
     "correctIndex": 2,
     "explanation": "Balloon Management is the VAT-registered one. (Section 9 — Invoicing)"
    },
    {
     "key": "bhq-q91",
     "prompt": "What does the Red Steps template show between Subtotal and Total Due?",
     "options": [
      "VAT @ 20% included",
      "VAT (NA)",
      "Nothing — no VAT line at all",
      "A discount line"
     ],
     "correctIndex": 2,
     "explanation": "Subtotal and total, nothing in between. (Section 9 — Invoicing)"
    },
    {
     "key": "bhq-q92",
     "prompt": "Where do you start a new invoice from?",
     "options": [
      "Last time's invoice for that client",
      "The brand's master template, saved as a new file named for the brand and invoice number",
      "A blank Word document",
      "Whichever file is open"
     ],
     "correctIndex": 1,
     "explanation": "Starting from an old invoice is how old numbers, names and dates leak through. (Section 9 — Invoicing)"
    },
    {
     "key": "bhq-q93",
     "prompt": "Which parts of the template do you never edit?",
     "options": [
      "The line items",
      "The Bill To section",
      "The bank details, company and VAT registration footer",
      "The invoice date"
     ],
     "correctIndex": 2,
     "explanation": "They're baked in. If they look wrong, stop and ask. (Section 9 — Invoicing)"
    },
    {
     "key": "bhq-q94",
     "prompt": "The bookings manager said VAT, but the template you've opened has no VAT line. What do you do?",
     "options": [
      "Add a VAT line yourself",
      "Send it without VAT",
      "You've probably got the wrong template — stop and ask",
      "Put the VAT in Notes"
     ],
     "correctIndex": 2,
     "explanation": "Wrong VAT on the template means wrong template. Never add or delete the line yourself. (Section 9 — Invoicing)"
    },
    {
     "key": "bhq-q95",
     "prompt": "Check-in 26 October, check-out 30 October. How many nights?",
     "options": [
      "3",
      "4",
      "5",
      "30"
     ],
     "correctIndex": 1,
     "explanation": "26, 27, 28, 29. Count them; don't trust it because it looks right. (Section 9 — Invoicing)"
    },
    {
     "key": "bhq-q96",
     "prompt": "The Rate column says \"Discounted\". What should it say?",
     "options": [
      "\"Discounted\" is fine",
      "The agreed discounted nightly rate as a number",
      "\"See notes\"",
      "The full rate with the discount in Notes"
     ],
     "correctIndex": 1,
     "explanation": "The client needs a figure they can multiply. (Section 9 — Invoicing)"
    },
    {
     "key": "bhq-q97",
     "prompt": "What are the three passes of the triple-check?",
     "options": [
      "Spelling, grammar, layout",
      "Right invoice, right figures, right recipient",
      "Brand, VAT, bank details",
      "Word file, PDF, email"
     ],
     "correctIndex": 1,
     "explanation": "Each pass looks for something different, on the PDF not the Word file. Any fix means all three again from the top. (Section 9 — Invoicing)"
    },
    {
     "key": "bhq-q98",
     "prompt": "You've raised an invoice at 11am. When does it go to the client?",
     "options": [
      "Tomorrow",
      "Same day",
      "Within 3 working days",
      "When they ask"
     ],
     "correctIndex": 1,
     "explanation": "Raised today, sent today. (Section 9 — Invoicing)"
    },
    {
     "key": "bhq-q99",
     "prompt": "It's 20 minutes before the end of your shift and you've been asked to raise an invoice. What do you do?",
     "options": [
      "Build it and send it so it's done",
      "Leave it for tomorrow",
      "Message the bookings manager first so they're ready to check it; get it checked and sent before you leave, or flag it as built-and-unchecked if nobody can",
      "Send it and ask them to check tomorrow"
     ],
     "correctIndex": 2,
     "explanation": "Before-you-leave never overrides the check. Nothing goes to a client unchecked. (Section 9 — Invoicing)"
    },
    {
     "key": "bhq-q100",
     "prompt": "How does an approved invoice go to the client?",
     "options": [
      "As a Word file from your own email",
      "As a WhatsApp image",
      "As a PDF from the brand's email address, invoice number in the subject line",
      "However is quickest"
     ],
     "correctIndex": 2,
     "explanation": "PDF, brand email, invoice number in the subject, short note. Then note on the booking that it's gone. (Section 9 — Invoicing)"
    }
   ],
   "downloads": []
  }
 ]
}$draft$::jsonb);

  raise notice 'Created "Booking Hunter — Full Training Quiz" as a draft. Open it in Admin → Courses, preview, then publish and assign.';
end;
$$;

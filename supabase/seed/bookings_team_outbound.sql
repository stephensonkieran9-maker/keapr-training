-- Keapr Training: "Bookings Team Outbound" course (draft).
-- Two video lessons, each followed by a 15-question quiz taken word for word
-- from the quiz documents. Pass mark 80% (12 of 15).
--   1. Role 2: Existing & Previous Guests
--   2. Role 2: Who You Contact (Existing & Previous Guests)
-- Not published: upload each lesson's video in the course builder (the
-- length fills in automatically), preview, then Publish and assign.
-- Safe to re-run: does nothing if a course with this title already exists.

do $$
declare
  v_admin uuid;
begin
  select id into v_admin from public.profiles where role = 'admin' and is_active order by created_at limit 1;
  if v_admin is null then
    raise exception 'No active admin found.';
  end if;
  if exists (select 1 from public.courses where title = 'Bookings Team Outbound') then
    raise notice 'A course called "Bookings Team Outbound" already exists. Nothing to do.';
    return;
  end if;

  insert into public.courses (title, description, is_demo, created_by, draft)
  values ('Bookings Team Outbound', 'Role 2: calling existing and previous guests. Two videos, each followed by a 15-question quiz (pass mark 12/15).', false, v_admin, $draft${
 "lessons": [
  {
   "key": "bto-l1",
   "title": "Role 2: Existing & Previous Guests",
   "kind": "video",
   "isTask": false,
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
   "downloads": [],
   "questions": [
    {
     "key": "bto-l1-q1",
     "prompt": "Who does Role 2 look after?",
     "options": [
      "Brand new leads who have never heard of Keapr",
      "Property owners looking for management",
      "Existing and previous guests who already know us",
      "Cleaners and maintenance contractors"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "bto-l1-q2",
     "prompt": "Why is warm outreach described as the cheapest, most reliable way to get bookings?",
     "options": [
      "Because the dialer does most of the work",
      "Because you're talking to people who already know us",
      "Because warm leads never say no",
      "Because it needs no follow-up"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "bto-l1-q3",
     "prompt": "What is the one-line mission of this role?",
     "options": [
      "Find as many new companies as possible each week",
      "Keep our best existing and previous guests booking with Keapr by calling them before they need us",
      "Manage check-ins and check-outs for all guests",
      "Close the biggest corporate contracts in the business"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "bto-l1-q4",
     "prompt": "Which of the following is NOT one of the account types you own in this role?",
     "options": [
      "Contractor companies who've housed lads with us before",
      "Insurance companies who've placed policyholders with us",
      "Relocation / corporate bookers who've already trusted us",
      "Estate agents selling properties locally"
     ],
     "correctIndex": 3,
     "explanation": ""
    },
    {
     "key": "bto-l1-q5",
     "prompt": "How should you think of yourself in relation to your accounts?",
     "options": [
      "A random caller",
      "Their \"accommodation person\"",
      "Their account manager for cleaning issues",
      "Their emergency contact"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "bto-l1-q6",
     "prompt": "Roughly how many meaningful call attempts should a good day include?",
     "options": [
      "Around 20",
      "Around 50",
      "Around 100",
      "Around 200"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "bto-l1-q7",
     "prompt": "Roughly how many live conversations with decision-makers does a good day look like?",
     "options": [
      "Around 5",
      "Around 20",
      "Around 50",
      "Around 100"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "bto-l1-q8",
     "prompt": "What is the Rule of 100?",
     "options": [
      "100 bookings per month",
      "100 warm reach outs per day for 100 days",
      "100 accounts in your Notion list at all times",
      "100 nights booked per week"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "bto-l1-q9",
     "prompt": "Who is your number one priority to call?",
     "options": [
      "Older high-value accounts",
      "People who stayed in the last 90 days",
      "People currently staying with us",
      "Companies who have never booked before"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "bto-l1-q10",
     "prompt": "When should you call an account that is currently staying with us?",
     "options": [
      "Only at check-in",
      "Only when they complain",
      "At check-in, mid-stay, and before they leave",
      "Once a month"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "bto-l1-q11",
     "prompt": "What's the rule about \"just checking in\" calls?",
     "options": [
      "They're the best way to build rapport",
      "Every call needs a purpose and a clear next step",
      "You should do at least ten a day",
      "They only count if they're under two minutes"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "bto-l1-q12",
     "prompt": "Which tool is described as \"your notebook and your brain\"?",
     "options": [
      "The dialer",
      "Hostaway",
      "Notion",
      "WhatsApp"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "bto-l1-q13",
     "prompt": "What do you use Hostaway for in this role?",
     "options": [
      "Logging call outcomes and setting reminders",
      "Looking up where a guest stayed before and checking availability on a live brief",
      "Storing your call scripts",
      "Sending invoices to clients"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "bto-l1-q14",
     "prompt": "After every real conversation, what should you update in Notion?",
     "options": [
      "Only the date you called",
      "Who you spoke to, where their lads are now, where they're going next, and any dates, locations or bed numbers",
      "The guest's star rating",
      "Nothing – Notion updates automatically from the dialer"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "bto-l1-q15",
     "prompt": "In a typical winning day, what happens between 9:15 and 12:00?",
     "options": [
      "Admin and Notion updates",
      "Deep call block with the dialer on, starting with current/recent guests",
      "Team meeting to review the week",
      "Checking Hostaway availability for every property"
     ],
     "correctIndex": 1,
     "explanation": ""
    }
   ]
  },
  {
   "key": "bto-l2",
   "title": "Role 2: Who You Contact (Existing & Previous Guests)",
   "kind": "video",
   "isTask": false,
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
   "downloads": [],
   "questions": [
    {
     "key": "bto-l2-q1",
     "prompt": "What does \"warm reach out\" mean in this role?",
     "options": [
      "Sending bulk emails to new companies",
      "One-to-one contact with people who already know us",
      "Posting on social media about Keapr",
      "Cold calling businesses near our properties"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "bto-l2-q2",
     "prompt": "Which two groups do you focus on in this role?",
     "options": [
      "Property owners and cleaners",
      "New enquiries and lost leads",
      "Existing guests staying with us now and previous guests who stayed in a business context",
      "Families and holidaymakers"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "bto-l2-q3",
     "prompt": "Why are existing guests described as \"the warmest of the warm\"?",
     "options": [
      "Because they always leave five-star reviews",
      "Because they've already chosen Keapr, they're on site, in work-mode and often have more nights or crews coming",
      "Because they pay in advance",
      "Because they live locally"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "bto-l2-q4",
     "prompt": "What are your three jobs when calling an existing guest?",
     "options": [
      "Upsell cleaning, ask for a review, confirm checkout time",
      "Check if they need to extend, protect their rooms with first refusal, find out where they're going next",
      "Collect payment, confirm ID, send house rules",
      "Ask about parking, Wi-Fi and bin day"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "bto-l2-q5",
     "prompt": "In the example call to an existing guest, what reason do you give for calling?",
     "options": [
      "We're raising prices from next month",
      "We've had a few enquiries for those dates going forward, so you wanted to check with them first",
      "The property is being sold",
      "We're changing cleaning companies"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "bto-l2-q6",
     "prompt": "What is \"first refusal\"?",
     "options": [
      "The guest's right to cancel for free",
      "Giving the guest the chance to keep or extend their rooms before we release them to anyone else",
      "The first complaint logged on a stay",
      "Declining the first price a guest offers"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "bto-l2-q7",
     "prompt": "If an existing guest says they don't need to extend, what do you do?",
     "options": [
      "Thank them and end the call",
      "Offer a discount to change their mind",
      "Pivot and ask where the lads are heading next and whether any other sites are coming up",
      "Transfer them to the closer"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "bto-l2-q8",
     "prompt": "Every current stay is described as one of three things. Which is NOT one of them?",
     "options": [
      "An extension opportunity",
      "A future-project mapping call",
      "A chance to catch issues early",
      "A chance to request a deposit top-up"
     ],
     "correctIndex": 3,
     "explanation": ""
    },
    {
     "key": "bto-l2-q9",
     "prompt": "Which previous guests should go on your list?",
     "options": [
      "Every guest who has ever stayed",
      "Only guests who stayed for more than 30 nights",
      "Guests who show any sign of booking for work or on behalf of others",
      "Guests who left a review"
     ],
     "correctIndex": 2,
     "explanation": ""
    },
    {
     "key": "bto-l2-q10",
     "prompt": "Which of the following is a sign a stay was a business booking?",
     "options": [
      "The guest booked on a weekend",
      "The guest used a business landline or work email, or booked with a company name",
      "The guest asked about local restaurants",
      "The guest brought children"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "bto-l2-q11",
     "prompt": "What are your three jobs when calling a previous business guest?",
     "options": [
      "Thank them for staying, confirm they're the person who sorts digs, find out when and where they'll need accommodation next",
      "Ask for a review, offer a discount code, send a brochure",
      "Confirm their address, check their payment method, update their email",
      "Ask about damage, remind them of house rules, close the account"
     ],
     "correctIndex": 0,
     "explanation": ""
    },
    {
     "key": "bto-l2-q12",
     "prompt": "In the previous-guest example, what question confirms you're talking to the decision-maker?",
     "options": [
      "\"Did you enjoy the Wi-Fi?\"",
      "\"Are you the one who normally sorts their accommodation for different sites?\"",
      "\"Can I speak to your manager?\"",
      "\"Would you like to see our other properties?\""
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "bto-l2-q13",
     "prompt": "What reason do you give a previous guest for calling them about future sites?",
     "options": [
      "We're running a promotion this month",
      "We're mapping where our regular crews are working over the next few months",
      "We need to fill empty rooms this week",
      "Head office asked us to call everyone"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "bto-l2-q14",
     "prompt": "Which group has the highest chance of repeat and bigger future bookings?",
     "options": [
      "Existing guests",
      "Previous business guests",
      "Weekend leisure guests",
      "New enquiries from Airbnb"
     ],
     "correctIndex": 1,
     "explanation": ""
    },
    {
     "key": "bto-l2-q15",
     "prompt": "According to the script, your job is NOT to \"sell hard\". What is it instead?",
     "options": [
      "Thank them, look after them, and make sure we're the first call when crews move",
      "Get a signed contract on every call",
      "Push the highest-priced property",
      "Book as many nights as possible regardless of fit"
     ],
     "correctIndex": 0,
     "explanation": ""
    }
   ]
  }
 ],
 "checklist": []
}$draft$::jsonb);

  raise notice 'Created "Bookings Team Outbound" as a draft. Upload the two videos, preview, then publish.';
end $$;

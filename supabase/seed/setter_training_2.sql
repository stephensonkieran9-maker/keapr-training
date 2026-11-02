-- Keapr Training: "Setter Training 2" course (draft), from the Monday Training Plan.
-- Needs migrations 0014 (reading lessons) and 0016 (task lessons).
-- Eight task lessons in the plan's order; each ends with "I've done this":
--   11:00 Full Script Warm-up (Sean)      11:10 Landmine Objection Drills (Sean)
--   12:00 Objection Flashcards            13:30 Write the Objections by Hand
--   14:00 Roleplay with Kieran            15:00 Game Tape: Record 3 Full Calls
--   15:45 Speed & Length Drill            16:00 Certification Check-In (Sean)
-- No videos or quiz. Not published: preview it, then Publish and assign.
-- Safe to re-run: does nothing if a course with this title already exists.

do $$
declare
  v_admin uuid;
begin
  select id into v_admin from public.profiles where role = 'admin' and is_active order by created_at limit 1;
  if v_admin is null then
    raise exception 'No active admin found.';
  end if;
  if exists (select 1 from public.courses where title = 'Setter Training 2') then
    raise notice 'A course called "Setter Training 2" already exists. Nothing to do.';
    return;
  end if;

  insert into public.courses (title, description, is_demo, created_by, draft)
  values ('Setter Training 2', 'Monday training plan: no live owner calls. Tighten the script and objections so you''re ready before you touch the database. Every lesson is a task: do it, then tick it off.', false, v_admin, $draft${
 "lessons": [
  {
   "key": "s2-warmup",
   "title": "11:00 · Full Script Warm-up (with Sean)",
   "kind": "reading",
   "isTask": true,
   "readingBody": "# Monday · 11:00–12:00 · Live Roleplay Block with Sean\n\nGoal for today: no live owner calls. Today is about tightening the script and objections so you're ready before you touch the database.\n\nObjective: Lock in the front of the call and the \"landmine\" objections.\n\n# Full Script Warm-up (10 min)\n\n- Run the full script once, start to finish.\n- Any time you go off-script, Sean will stop you, give the exact line, and you repeat that line 3 times before moving on.",
   "objectives": [
    "Run the full script once, start to finish, with Sean"
   ],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 80,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 10,
   "hasQuiz": false,
   "questions": [],
   "downloads": []
  },
  {
   "key": "s2-landmines",
   "title": "11:10 · Landmine Objection Drills (with Sean)",
   "kind": "reading",
   "isTask": true,
   "readingBody": "# Landmine Objection Drills (50 min)\n\nWe focus only on these early derailer objections:\n\n- \"I don't remember you.\"\n- \"How much do you charge / what's your cut?\"\n- \"Can't you just email me something?\"\n- \"Am I tied in / what's the catch?\"\n\n# Format\n\n- Sean throws one of these objections at you.\n- You give: one clean sentence answer from the sheet + bridge line + straight back to \"I've got [Day, Time A] or [Day, Time B] – what's easier?\"\n- If you ramble, add reasons, or miss the bridge, you stop and redo that objection until you can do it clean 5 times in a row.",
   "objectives": [
    "Handle the four early derailer objections cleanly, 5 times in a row"
   ],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 80,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 50,
   "hasQuiz": false,
   "questions": [],
   "downloads": []
  },
  {
   "key": "s2-flashcards",
   "title": "12:00 · Objection Flashcards",
   "kind": "reading",
   "isTask": true,
   "readingBody": "# Monday · 12:00–14:00 · Solo Drill Block\n\nObjective: Get the objections and bridge line into muscle memory.\n\n# Objection Flashcards (60–90 min)\n\nMake physical cards:\n\n- Front = owner line (e.g. \"How much do you charge?\").\n- Back = our exact answer + the bridge line.\n\nDrill through all 12 objections until you can:\n\n- Read the front and say the back within 3 seconds.\n- Do a full run of all 12 without looking at the sheet.",
   "objectives": [
    "Say the answer and bridge line within 3 seconds for all 12 objections"
   ],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 80,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 90,
   "hasQuiz": false,
   "questions": [],
   "downloads": []
  },
  {
   "key": "s2-handwrite",
   "title": "13:30 · Write the Objections by Hand",
   "kind": "reading",
   "isTask": true,
   "readingBody": "# Write the Objections by Hand (30 min)\n\n- From memory, write out all 12 objection answers + the bridge line.\n- Then compare with the sheet, correct any mistakes, and rewrite the incorrect ones properly.",
   "objectives": [
    "Write all 12 objection answers and the bridge line from memory"
   ],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 80,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 30,
   "hasQuiz": false,
   "questions": [],
   "downloads": []
  },
  {
   "key": "s2-interruptions",
   "title": "14:00 · Roleplay with Kieran: Interruption Machine",
   "kind": "reading",
   "isTask": true,
   "readingBody": "# Monday · 14:00–15:00 · Roleplay Block with Kieran\n\nObjective: Handle interruptions and objections in random order.\n\nKieran's job is to be the \"interruption machine.\"\n\nRun multiple short calls where he:\n\n- Interrupts you mid-script.\n- Throws any of the 12 objections in any order (and may repeat the same one).\n\nYour job every time:\n\n- One-sentence answer from the sheet.\n- Bridge line.\n- Straight back to offering two times for the planning call.\n\nStandard: if you miss the line or over-talk, you redo that objection until you hit it clean 3 times in a row.",
   "objectives": [
    "Handle interruptions and all 12 objections in random order"
   ],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 80,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 60,
   "hasQuiz": false,
   "questions": [],
   "downloads": []
  },
  {
   "key": "s2-gametape",
   "title": "15:00 · Game Tape: Record 3 Full Calls",
   "kind": "reading",
   "isTask": true,
   "readingBody": "# Monday · 15:00–16:00 · Solo \"Game Tape\" & Speed Drills\n\nObjective: See and hear yourself, and keep the call within 3–5 minutes.\n\n# Record 3 Full Calls (40–45 min)\n\nOn Zoom, record three separate practice calls:\n\n- Call 1: Easy yes (no objections, just the core script).\n- Call 2: Includes \"I don't remember you\" + \"How much do you charge?\".\n- Call 3: Includes \"Can't you just email me?\" + \"Am I tied in?\".\n\nAfter recording, watch each back and write down 3 things to improve (pace, filler words, missed lines, objection handling).",
   "objectives": [
    "Record three practice calls on Zoom and note 3 things to improve on each"
   ],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 80,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 45,
   "hasQuiz": false,
   "questions": [],
   "downloads": []
  },
  {
   "key": "s2-speed",
   "title": "15:45 · Speed & Length Drill",
   "kind": "reading",
   "isTask": true,
   "readingBody": "# Speed & Length Drill (15–20 min)\n\n- Run the full script 3–5 times, timed each run.\n- Target: 3–5 minutes per call.\n- If you're over 5 minutes, you're over-explaining – tighten answers and stick to the script.",
   "objectives": [
    "Run the full script 3–5 times, timed, within 3–5 minutes each"
   ],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 80,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 20,
   "hasQuiz": false,
   "questions": [],
   "downloads": []
  },
  {
   "key": "s2-checkin",
   "title": "16:00 · Certification Check-In with Sean",
   "kind": "reading",
   "isTask": true,
   "readingBody": "# Monday · 16:00–16:30 · Certification Check-In with Sean\n\nObjective: Decide if you're close to ready for real owner calls later this week.\n\n# 1. One \"Easy Yes\" Call\n\n- Full script, no major objections.\n- Sean is checking accuracy, tone, and pacing.\n\n# 2. One \"Maybe with 3 Objections\" Call\n\n- Sean will throw at least three objections (including one \"send me info\").\n- Sean is checking: one-line answer, bridge line, straight back to two times.\n\nIf you stay on script, handle objections cleanly, and keep the call under 5 minutes, you're nearly ready for live calls. If not, you repeat parts of this plan tomorrow before you touch the database.",
   "objectives": [
    "An easy-yes call and a maybe-with-3-objections call with Sean"
   ],
   "notes": "",
   "videoRef": "",
   "videoSeconds": 0,
   "passPercent": 80,
   "requiredWatchPercent": 100,
   "isRequired": true,
   "estimatedMinutes": 30,
   "hasQuiz": false,
   "questions": [],
   "downloads": []
  }
 ],
 "checklist": []
}$draft$::jsonb);

  raise notice 'Created "Setter Training 2" as a draft. Preview it, then publish and assign.';
end $$;

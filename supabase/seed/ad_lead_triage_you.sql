-- Keapr Training: Ad-Lead Triage quizzes say "you" instead of "Reed".
-- Changes only the quiz questions and answers whose text exactly matches the
-- old "Reed" wording (45 lines across the Day 1 and Day 2 quizzes). Every
-- other part of the course draft is left as it is: your lessons, videos,
-- downloads, text and any questions you've edited or added.
-- After running: preview, then Publish so learners get the new wording.
-- Safe to re-run: once a line is changed it no longer matches.

do $$
declare
  v_map jsonb := $map${
 "What is Reed's job on an ad-lead triage call?": "What is your job on an ad-lead triage call?",
 "In the opener, how long does Reed say the call will take?": "In the opener, how long do you say the call will take?",
 "How does Reed introduce the reason for the call?": "How do you introduce the reason for the call?",
 "The lead says \"I'm busy but go ahead.\" What does Reed do?": "The lead says \"I'm busy but go ahead.\" What do you do?",
 "It is a genuinely bad time. How does Reed offer a callback?": "It is a genuinely bad time. How do you offer a callback?",
 "How long a call does Reed propose for that callback?": "How long a call do you propose for that callback?",
 "Once the callback is booked, what does Reed do?": "Once the callback is booked, what do you do?",
 "Quickly run through Question 1 while he has them": "Quickly run through Question 1 while you have them",
 "Ask Question 2 so he can tag them before the callback": "Ask Question 2 so you can tag them before the callback",
 "The lead has no listing live yet. What does Reed do?": "The lead has no listing live yet. What do you do?",
 "Why does Reed tell a pre-launch lead that Keapr's help \"kicks in once the place is live\"?": "Why do you tell a pre-launch lead that Keapr's help \"kicks in once the place is live\"?",
 "After confirming the lead is already hosting, what does Reed ask next?": "After confirming the lead is already hosting, what do you ask next?",
 "In option B, which channels does Reed say Keapr adds?": "In option B, which channels do you say Keapr adds?",
 "The lead says \"both, really – not sure.\" What is Reed's follow-up?": "The lead says \"both, really – not sure.\" What is your follow-up?",
 "How is the Hybrid link delivered, and what does Reed confirm before sending?": "How is the Hybrid link delivered, and what do you confirm before sending?",
 "In Branch B, what is the next step Reed offers?": "In Branch B, what is the next step you offer?",
 "A 5-minute call with Reed next week": "A 5-minute call with you next week",
 "The lead picks a slot. What is the correct order of what Reed does next?": "The lead picks a slot. What is the correct order of what you do next?",
 "What is included in full management, as Reed describes it?": "What is included in full management, as you describe it?",
 "The lead asks for projections on the triage call. What does Reed offer?": "The lead asks for projections on the triage call. What do you offer?",
 "Lead says \"both, really,\" Reed asks what annoys them more, and they say \"my cleaners keep letting me down.\" Which branch?": "Lead says \"both, really,\" you ask what annoys them more, and they say \"my cleaners keep letting me down.\" Which branch?",
 "Lead: \"Just send me the Hybrid link AND book me a call with the closer, I'll decide later.\" What does Reed do?": "Lead: \"Just send me the Hybrid link AND book me a call with the closer, I'll decide later.\" What do you do?",
 "Lead asks what they'd earn. Reed says \"a 2-bed in your town? Easily £2,500 a month.\" What went wrong?": "Lead asks what they'd earn. You say \"a 2-bed in your town? Easily £2,500 a month.\" What went wrong?",
 "He made up a projection instead of offering the short form and letting the closer build real projections on the planning call": "You made up a projection instead of offering the short form and letting the closer build real projections on the planning call",
 "He should have said £3,000 to be safe": "You should have said £3,000 to be safe",
 "He should have refused to discuss numbers at all": "You should have refused to discuss numbers at all",
 "Lead picks Tuesday at 2pm. Reed says \"Great, Tuesday 2pm it is, speak then!\" and hangs up. What did he miss?": "Lead picks Tuesday at 2pm. You say \"Great, Tuesday 2pm it is, speak then!\" and hang up. What did you miss?",
 "After the commitment question the lead says \"probably, yeah, I think so.\" What should Reed do?": "After the commitment question the lead says \"probably, yeah, I think so.\" What should you do?",
 "Reed answers the contract-length objection perfectly, then goes quiet. What's missing?": "You answer the contract-length objection perfectly, then go quiet. What's missing?",
 "Lead fires three objections in a row: price, contract, cleaning. What is the principle Reed follows?": "Lead fires three objections in a row: price, contract, cleaning. What is the principle you follow?",
 "Lead: \"I don't want more bookings and I'm fine managing it myself.\" What does Reed say?": "Lead: \"I don't want more bookings and I'm fine managing it myself.\" What do you say?",
 "Lead asks for projections and says yes to the form. Why does Reed send it?": "Lead asks for projections and says yes to the form. Why do you send it?",
 "So Reed can work out the projections himself before the call": "So you can work out the projections yourself before the call",
 "In the Day 2 \"Hard Landlord\" role-play, which objections does the trainer hit Reed with?": "In the Day 2 \"Hard Landlord\" role-play, which objections does the trainer hit you with?",
 "After each live call in Live Calls With Spot-Coaching, how much feedback does Reed get?": "After each live call in Live Calls With Spot-Coaching, how much feedback do you get?",
 "Exactly two notes – one thing he did well, one thing to fix": "Exactly two notes – one thing you did well, one thing to fix",
 "In the Lock-In Quiz, what must Reed do for each objection thrown at him?": "In the Lock-In Quiz, what must you do for each objection thrown at you?",
 "Give any answer in his own words": "Give any answer in your own words",
 "Reed stumbles on two objections in the Lock-In Quiz. What happens?": "You stumble on two objections in the Lock-In Quiz. What happens?",
 "He goes live anyway – two is acceptable": "You go live anyway – two is acceptable",
 "He re-sits the whole quiz the same afternoon": "You re-sit the whole quiz the same afternoon",
 "The trainer takes those objections off his list": "The trainer takes those objections off your list",
 "So Reed can hear where he hesitates and where he adds \"ums\" or rambles": "So you can hear where you hesitate and where you add \"ums\" or ramble",
 "In the Day 2 Walkthrough + Hand-Writing, what does Reed physically do with each objection?": "In the Day 2 Walkthrough + Hand-Writing, what do you physically do with each objection?",
 "Record himself saying it": "Record yourself saying it"
}$map$::jsonb;
  r record;
  v_new jsonb;
  v_before int;
  v_total int := 0;
begin
  for r in select id, title, draft from public.courses where draft ? 'lessons' loop
    select count(*) into v_before
    from jsonb_array_elements(r.draft->'lessons') l,
         jsonb_array_elements(coalesce(l->'questions', '[]'::jsonb)) q,
         lateral (select q->>'prompt' t union all select o #>> '{}' from jsonb_array_elements(coalesce(q->'options', '[]'::jsonb)) o) x
    where v_map ? x.t;
    continue when v_before = 0;

    select jsonb_set(r.draft, '{lessons}', jsonb_agg(
             case when jsonb_typeof(l->'questions') = 'array' then
               jsonb_set(l, '{questions}', (
                 select coalesce(jsonb_agg(
                          jsonb_set(
                            case when v_map ? (q->>'prompt') then jsonb_set(q, '{prompt}', v_map->(q->>'prompt')) else q end,
                            '{options}',
                            (select coalesce(jsonb_agg(case when v_map ? (o #>> '{}') then v_map->(o #>> '{}') else o end order by oi), '[]'::jsonb)
                             from jsonb_array_elements(coalesce(q->'options', '[]'::jsonb)) with ordinality ox(o, oi)))
                          order by qi), '[]'::jsonb)
                 from jsonb_array_elements(l->'questions') with ordinality qx(q, qi)))
             else l end
             order by li))
    into v_new
    from jsonb_array_elements(r.draft->'lessons') with ordinality lx(l, li);

    update public.courses set draft = v_new, updated_at = now() where id = r.id;
    v_total := v_total + v_before;
    raise notice 'Updated % quiz lines in "%".', v_before, r.title;
  end loop;

  if v_total = 0 then
    raise notice 'Nothing to change: no quiz lines with the old "Reed" wording were found.';
  else
    raise notice 'Done. Preview the course, then Publish so learners get the new wording.';
  end if;
end $$;

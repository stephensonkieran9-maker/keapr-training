# Listing assessments (candidate screening)

A timed listing-build test for job candidates. It sits inside Keapr Training under **Admin → Assessments**, but candidates are kept completely separate from staff: they register through an assessment's link, never get a staff account, and can't see any training.

## Setup (once)

1. In the Supabase SQL editor, run `supabase/migrations/0018_listing_assessments.sql`, then `0019_assessment_photos.sql` (a private bucket for property photos).
2. Create the sample from **Admin → Assessments → New from sample case study** (The Hollies House). It starts **closed**, and it can't be opened until its photos are uploaded on the **Photos** tab.
3. Check `NEXT_PUBLIC_SITE_URL` is set in Vercel. Candidate links are built from it.

Nothing else is needed: no new environment variables, and Supabase sign-ups stay switched off.

## How it works for a candidate

1. Opens the link (`/assess/<code>`) and registers with name, email, optional phone and a password.
2. Reads the instructions and presses **Start test**. Timing starts on the server, but they're never shown a timer.
3. Sees the case study on the left and a listing builder on the right (on phones these are two tabs). Answers autosave every few seconds and when the tab is hidden.
4. Submits. If they reach the hidden cut-off, whatever they've entered is submitted automatically (including if they've closed the page).
5. Sees a thank-you page. They don't see their score.

Each candidate gets **one attempt**. Closing the page, refreshing or switching device (by signing in again) carries on the same attempt.

## Admin guide

**Assessments list.** Create one from the sample or blank, and see registrations, finishes and the best score.

**Results tab.** Candidates are ranked by accuracy, then by time taken. **Results CSV** downloads the same ranking. Click a name to see every field: their answer, the answer key and the mark.

**Setup tab.** Edit the title, the hidden cut-off (5–240 minutes, default 120) and the instructions shown before starting. Candidates never see a timer, the cut-off or how many fields they've filled in; you see how long each one took in the results. **Make a new link** retires the old one. **Duplicate** copies the case study and answer key without the candidates, which is the quickest way to write a second case study. **Archive** hides an assessment and keeps its results.

**Photos tab.** Upload every listing photo (JPG, PNG or WebP, up to 15 MB each) and choose which room each one shows. Candidates download a zip of the photos in a shuffled order with neutral names (photo-01.jpg…), upload them all, and put them in this order: **living spaces, dining, kitchen, bedrooms, bathrooms, then anything else**. Photos from the same room can go in any order among themselves. Each re-upload is matched to the original by its exact file contents, so a candidate who edits or re-saves a photo gets a warning and it doesn't count. Marks = share of the photos uploaded × share of photo pairs in the right order. On each candidate's page you can see the order they chose.

**Case study tab.** Write the scenario in a simple format with a live preview: `#` headings, `- ` bullets, `| tables |`, `> ` quotes, `**bold**`, `---` dividers.

**Answer key tab.** It uses the same inputs candidates see. For each field:
- **On/Off** controls whether the field appears in the form.
- **Weight** is how many points it's worth. Accuracy = points earned ÷ points available. Weight 0 shows a field without marking it.
- **±** (number fields only) sets how far off still counts as correct, e.g. ±1 on a calculated quote.
- **Text fields** (title, description, rules) are marked on the facts they mention, with the weight shared equally between the facts. A long text field such as the description can also have **extra points for writing quality**: half for reading as sentences rather than bullet points, half for being in the candidate's own words. Up to a quarter copied word for word from the brief is fine; above that the marks drop, to none at three-quarters. Only runs of 6 or more identical words count as copying, so keywords like "free Wi-Fi" never do. Put one fact per line, with alternatives separated by `|`, e.g. `3 bed|three bed|3 bedroom`. Matching ignores case and punctuation and uses whole words. You can read exactly what each candidate wrote on their page.
- **Amenities and target guests** are marked by overlap (correct ticks ÷ all ticks either side), so ticking everything scores badly.
- **Address fields** ignore case, spaces and punctuation.

An assessment can't be opened until the key has no problems.

**Changing things after candidates have started.** Each attempt keeps the case study and answer key it started with. If you fix a mistake in the key, press **Re-mark everyone** on the Results tab: it re-marks every submitted attempt with the current key (their answers don't change) and records it in the audit log.

**Adjusting a mark.** On a candidate's page, every marked field has **Adjust**: set the points and give a reason, for example after reading their description. Their accuracy and ranking update straight away, the automatic mark is shown alongside, and the change is in the audit log. **Go back to the automatic mark** removes it. Adjustments survive **Re-mark everyone**.

**Candidate page.**
- *Set password*: for a candidate who has forgotten theirs. There's no email reset, so you send it to them yourself.
- *Reset attempt*: lets them start again with a full timer, e.g. after a genuine technical problem. A reason is required, and the old answers and score are kept in the audit log.
- *Delete candidate*: removes their details and answers completely (data requests, or when you no longer need them).

## Adding or changing fields

The available fields are listed in `lib/assessment/fields.ts`. Turning fields on or off is done per assessment in the answer key. A brand-new kind of field (e.g. "Bin collection day") is a small code change in that file.

## Limits worth knowing

- The timer and marking run on the server, and the answer key never reaches the browser. Candidates can still look things up or ask someone else for help: this is a screening exercise, not an invigilated exam.
- There's no limit on sign-in attempts per email yet. Passwords are hashed with scrypt, which slows guessing down. Add rate limiting if links are shared publicly.
- Candidate accounts only work for the assessment they registered on.

## Sample case study

`lib/assessment/sample.ts` holds the sample (The Hollies House) in the team's usual brief format, with its answer key. Two things were added to the supplied case study: a **28-night minimum stay** and the standard **Strict (14 days)** cancellation. Fields the brief doesn't cover are switched off. **Check the answer key before sending the link to real candidates.**

## Reverting the "own description" change (Nov 2026)

The version from before candidates wrote their own description is kept two ways:
- `lib/assessment/sample-hollies-v1.ts`: the previous brief and answer key. Copy its exports back into `sample.ts` to restore them.
- The `backup/assessments-v1-hollies` branch on GitHub: the whole app as it was.

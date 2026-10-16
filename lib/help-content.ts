// Help page text, shared with search. Describes how the app behaves only:
// no company policy here. Pure data, safe in the browser.

export const steps = [
  { title: "Your courses", body: "Courses are assigned to you by an admin and appear on your dashboard. The Next lesson panel always points to the first lesson you haven't passed." },
  { title: "Watch the lesson", body: "The quiz unlocks once you've watched enough of the video (each lesson shows how much). Only the parts that actually play count, so skipping ahead won't unlock it. Your place is saved, so you can stop and carry on later on any device." },
  { title: "Take the quiz", body: "Answer every question, then submit. The pass mark is shown before you start. Some lessons have no quiz: watching the video through completes them." },
  { title: "Retry if you need to", body: "If you don't pass, you'll see your score and an explanation for each question. Review the lesson and try again as often as you need. Every attempt is saved, and a later attempt never removes a pass." },
  { title: "Finish the course", body: "A course is complete once every required lesson is passed. Your completion date is recorded, and passed lessons stay available to rewatch." },
];

export const faqs = [
  { q: "The quiz is still locked", a: "Check the bar under the video: it shows how much you've watched and how much is needed. Parts you skipped don't count, so go back and play them. If the bar is full and the quiz is still locked, refresh the page. If that doesn't work, report it below." },
  { q: "A lesson has a padlock", a: "Lessons open in order. Pass the quiz for the lesson before it (or, if it has no quiz, watch it through) to unlock it." },
  { q: "The video won't play", a: "Refresh the page and check your connection. Try an up-to-date browser such as Chrome, Safari or Edge, or another device. If it still won't play, report it below and say which lesson." },
  { q: "My progress didn't save", a: "Progress saves every few seconds, when you pause and when you leave the page. If saving fails you'll see a red message under the video; keep the page open and it will retry when your connection is back." },
  { q: "I can't see a course I expected", a: "Courses only appear once an admin assigns them to you. You'll get a notification (the bell at the top) when one is added. If you think one is missing, ask your manager." },
  { q: "Can I use my phone?", a: "Yes. Open the site in your phone's browser and sign in; there's no app to install. Turn your phone sideways for a bigger video." },
  { q: "I forgot my password", a: "Use Forgot password on the sign-in page. If the email doesn't arrive, ask an admin to send you a password reset link." },
  { q: "What does the app record?", a: "Which parts of each video you've watched, your quiz answers and scores, and when you complete lessons and courses. Admins can see this to track training. Watch tracking checks that a lesson was played; it isn't a measure of attention." },
];

export const adminTopics = [
  { q: "Add someone", a: "Staff → Add someone. You get a one-time link to send them however you like. It expires after the time set in Supabase (24 hours if you've changed it). Need another? Open their Staff page and get a new link." },
  { q: "Assign a course", a: "Open the person on the Staff page → Assign a course. They get a notification. Only published courses can be assigned." },
  { q: "Build or change a course", a: "Courses → New course. Add lessons, upload each video (under 50 MB), add quiz questions and set the pass mark. Save draft, check it with Preview as learner, then Publish. Each publish is a new version: people who've started keep the version they began; new assignments get the latest." },
  { q: "Track progress", a: "Overview shows everyone at a glance, where people get stuck and who needs a nudge. Reports lets you filter and download progress or every quiz attempt as a spreadsheet." },
  { q: "Fix someone's progress", a: "On their Staff page, open a course's Lessons list to Mark complete a lesson (a reason is required and it shows as admin-marked). Use Unassign or reset to remove a course, with or without their progress, or start them again from lesson 1. Quiz attempts are never deleted." },
  { q: "Problem reports and notifications", a: "Reports sent from the Help page, and course completions, arrive in your notifications (the bell). Each links to the person's Staff page." },
  { q: "About watch tracking", a: "The quiz unlocks once enough of the video has actually played. It's a practical training gate, not proof that someone paid attention." },
];

/** Anchor id for a help topic, used by search links. */
export function faqId(q: string): string {
  return "help-" + q.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

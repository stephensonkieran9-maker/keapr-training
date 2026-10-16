import Link from "next/link";
import { Icon } from "@/components/Icons";
import { ReportProblemForm } from "@/components/ReportProblemForm";
import { requireProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Help · Keapr Training" };

const GETTING_STARTED = "Getting started with Keapr Training";

// Describes how the app behaves only. No company policy here.
const steps = [
  { title: "Your courses", body: "Courses are assigned to you by an admin and appear on your dashboard. The Next lesson panel always points to the first lesson you haven't passed." },
  { title: "Watch the lesson", body: "The quiz unlocks once you've watched enough of the video (each lesson shows how much). Only the parts that actually play count, so skipping ahead won't unlock it. Your place is saved, so you can stop and carry on later on any device." },
  { title: "Take the quiz", body: "Answer every question, then submit. The pass mark is shown before you start." },
  { title: "Retry if you need to", body: "If you don't pass, you'll see your score and an explanation for each question. Review the lesson and try again as often as you need. Every attempt is saved, and a later attempt never removes a pass." },
  { title: "Finish the course", body: "A course is complete once every required lesson is passed. Your completion date is recorded, and passed lessons stay available to rewatch." },
];

const faqs = [
  { q: "The quiz is still locked", a: "Check the bar under the video: it shows how much you've watched and how much is needed. Parts you skipped don't count, so go back and play them. If the bar is full and the quiz is still locked, refresh the page. If that doesn't work, report it below." },
  { q: "A lesson has a padlock", a: "Lessons open in order. Pass the quiz for the lesson before it to unlock it." },
  { q: "The video won't play", a: "Refresh the page and check your connection. Try an up-to-date browser such as Chrome, Safari or Edge, or another device. If it still won't play, report it below and say which lesson." },
  { q: "My progress didn't save", a: "Progress saves every few seconds, when you pause and when you leave the page. If saving fails you'll see a red message under the video; keep the page open and it will retry when your connection is back." },
  { q: "I can't see a course I expected", a: "Courses only appear once an admin assigns them to you. You'll get a notification (the bell at the top) when one is added. If you think one is missing, ask your manager." },
  { q: "Can I use my phone?", a: "Yes. Open the site in your phone's browser and sign in; there's no app to install. Turn your phone sideways for a bigger video." },
  { q: "I forgot my password", a: "Use Forgot password on the sign-in page. If the email doesn't arrive, ask an admin to send you a password reset link." },
  { q: "What does the app record?", a: "Which parts of each video you've watched, your quiz answers and scores, and when you complete lessons and courses. Admins can see this to track training. Watch tracking checks that a lesson was played; it isn't a measure of attention." },
];

export default async function HelpPage() {
  type CV = { course_id: string; title: string };
  let enrolments: { course_versions: unknown }[] | null = [];
  let isAdmin = true; // local preview without a database shows everything
  if (isSupabaseConfigured()) {
    const { profile, supabase } = await requireProfile();
    isAdmin = profile.role === "admin";
    ({ data: enrolments } = await supabase
      .from("enrolments")
      .select("course_versions(course_id, title)")
      .eq("learner_id", profile.id)
      .is("unassigned_at", null));
  }
  const courses = (enrolments ?? [])
    .map((e) => e.course_versions as unknown as CV | CV[] | null)
    .map((cv) => (Array.isArray(cv) ? cv[0] : cv))
    .filter((cv): cv is CV => Boolean(cv));
  const gettingStarted = courses.find((c) => c.title === GETTING_STARTED);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow"><b>Help</b></div>
          <h1>How Keapr Training works</h1>
          <p>Quick answers, and a way to tell us if something isn't working.</p>
        </div>
        <div className="actions-row">
          {gettingStarted && (
            <Link className="btn btn-ghost btn-sm" href={`/courses/${gettingStarted.course_id}`}><Icon name="play" />Rewatch Getting started</Link>
          )}
          <a className="btn btn-primary btn-sm" href="#report">Report a problem</a>
        </div>
      </div>

      <section className="card" aria-labelledby="how-title">
        <h2 id="how-title">The basics</h2>
        <ol className="help-steps">
          {steps.map((s, i) => (
            <li key={s.title}>
              <span className="help-num" aria-hidden="true">{i + 1}</span>
              <div><h3>{s.title}</h3><p>{s.body}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <div className="two-col">
        <section className="card" aria-labelledby="faq-title">
          <h2 id="faq-title">Common questions</h2>
          <div className="faq">
            {faqs.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="card" id="report" aria-labelledby="report-title">
          <h2 id="report-title">Report a problem</h2>
          <p className="muted" style={{ marginTop: 0 }}>Something broken or confusing? Tell us here and every admin gets a notification. For anything urgent, speak to your manager.</p>
          <ReportProblemForm courses={courses.map((c) => c.title)} />
        </section>
      </div>

      {isAdmin && (
        <section className="card" aria-labelledby="admin-help-title">
          <h2 id="admin-help-title">For admins</h2>
          <div className="faq">
            <details>
              <summary>Add someone</summary>
              <p>Staff → <b>Add someone</b>. You get a one-time link to send them however you like. It expires after the time set in Supabase (24 hours if you've changed it). Need another? Open their Staff page and get a new link.</p>
            </details>
            <details>
              <summary>Assign a course</summary>
              <p>Open the person on the Staff page → <b>Assign a course</b>. They get a notification. Only published courses can be assigned.</p>
            </details>
            <details>
              <summary>Build or change a course</summary>
              <p>Courses → <b>New course</b>. Add lessons, upload each video (under 50 MB), add quiz questions and set the pass mark. <b>Save draft</b>, check it with <b>Preview as learner</b>, then <b>Publish</b>. Each publish is a new version: people who've started keep the version they began; new assignments get the latest.</p>
            </details>
            <details>
              <summary>Track progress</summary>
              <p><b>Overview</b> shows everyone at a glance, where people get stuck and who needs a nudge. <b>Reports</b> lets you filter and download progress or every quiz attempt as a spreadsheet.</p>
            </details>
            <details>
              <summary>Fix someone's progress</summary>
              <p>On their Staff page, open a course's <b>Lessons</b> list to <b>Mark complete</b> a lesson (a reason is required and it shows as admin-marked). Use <b>Unassign or reset</b> to remove a course, with or without their progress, or start them again from lesson 1. Quiz attempts are never deleted.</p>
            </details>
            <details>
              <summary>Problem reports and notifications</summary>
              <p>Reports sent from this page, and course completions, arrive in your notifications (the bell). Each links to the person's Staff page.</p>
            </details>
            <details>
              <summary>About watch tracking</summary>
              <p>The quiz unlocks once enough of the video has actually played. It's a practical training gate, not proof that someone paid attention.</p>
            </details>
          </div>
        </section>
      )}
    </>
  );
}

import Link from "next/link";
import { Icon } from "@/components/Icons";
import { ReportProblemForm } from "@/components/ReportProblemForm";
import { requireProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { adminTopics, faqs, faqId, steps } from "@/lib/help-content";
import { OpenFromHash } from "@/components/OpenFromHash";

export const dynamic = "force-dynamic";
export const metadata = { title: "Help · Keapr Training" };

const GETTING_STARTED = "Getting started with Keapr Training";
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
      <OpenFromHash />
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
              <details key={f.q} id={faqId(f.q)}>
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
            {adminTopics.map((f) => (
              <details key={f.q} id={faqId(f.q)}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

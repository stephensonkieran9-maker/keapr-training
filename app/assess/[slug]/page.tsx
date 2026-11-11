import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CaseStudy } from "@/components/assessment/CaseStudy";
import { RegisterForm, SignInForm, StartForm } from "@/components/assessment/CandidateForms";
import { currentCandidate, getAssessmentBySlug, getAttempt } from "@/lib/assessment/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signOutAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Assessment · Keapr", robots: { index: false, follow: false } };

function Shell({ title, children, wide }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="auth-page">
      <main className={`auth-card assess-card${wide ? " wide" : ""}`}>
        <div className="auth-brand"><span className="mark">K</span><span>Keapr<small>Assessment</small></span></div>
        <h1>{title}</h1>
        {children}
      </main>
    </div>
  );
}

export default async function AssessmentLanding({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  if (!isSupabaseConfigured()) notFound();
  const { slug } = await params;
  const { mode } = await searchParams;
  const a = await getAssessmentBySlug(slug);
  if (!a) notFound();

  const candidate = await currentCandidate(a.id);

  if (!candidate) {
    const signIn = mode === "signin" || !a.isOpen;
    return (
      <Shell title={a.title}>
        {!a.isOpen && <p className="notice">This assessment isn&apos;t taking new registrations at the moment. If you&apos;ve already registered, sign in below.</p>}
        {a.isOpen && <p className="auth-intro">Register to take the listing exercise. It doesn&apos;t start until you press Start.</p>}
        {signIn ? <SignInForm slug={slug} /> : <RegisterForm slug={slug} />}
        <div className="auth-foot">
          {signIn
            ? a.isOpen && <>New here? <Link href={`/assess/${slug}`}>Register</Link></>
            : <>Already registered? <Link href={`/assess/${slug}?mode=signin`}>Sign in</Link></>}
          {signIn && <p className="hint">Forgotten your password? Contact the person who sent you this link.</p>}
        </div>
      </Shell>
    );
  }

  const attempt = await getAttempt(candidate.id);
  if (attempt && !attempt.submittedAt) redirect(`/assess/${slug}/test`);

  const signOut = (
    <form action={signOutAction} className="assess-signout">
      <input type="hidden" name="slug" value={slug} />
      <span>Signed in as {candidate.email}.</span> <button type="submit" className="lb-link">Sign out</button>
    </form>
  );

  if (attempt?.submittedAt) {
    return (
      <Shell title="Thanks, your listing has been submitted">
        <p className="auth-intro">
          We&apos;ve received your answers.{" "}
          The team will review your result and be in touch. You don&apos;t need to do anything else.
        </p>
        {signOut}
      </Shell>
    );
  }

  return (
    <Shell title={`Welcome, ${candidate.fullName.split(" ")[0]}`} wide>
      <CaseStudy text={a.intro} className="assess-intro" />
      <dl className="assess-facts">
        <div><dt>Attempts</dt><dd>One</dd></div>
        <div><dt>Saving</dt><dd>Automatic</dd></div>
      </dl>
      {a.isOpen
        ? <StartForm slug={slug} />
        : <p className="notice">This assessment has been closed, so it can&apos;t be started now.</p>}
      {signOut}
    </Shell>
  );
}

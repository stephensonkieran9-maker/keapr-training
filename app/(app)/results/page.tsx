import Link from "next/link";
import { QuizResults } from "@/components/QuizResults";
import { ComingSoon } from "@/components/ComingSoon";
import { getMyQuizResults } from "@/lib/quiz-results";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "My results · Keapr Training" };

export default async function ResultsPage() {
  if (!isSupabaseConfigured()) {
    return <ComingSoon title="My results" body="Quiz results need a signed-in account. Open the live app to see yours." />;
  }
  const results = await getMyQuizResults();
  return (
    <div className="ov">
      <div className="page-head">
        <div>
          <h1>My results</h1>
          <p>Every quiz you&apos;ve taken. Open one to see each attempt and your answers.</p>
        </div>
      </div>
      {results.length > 0 ? (
        <QuizResults results={results} />
      ) : (
        <p className="empty">
          You haven&apos;t taken a quiz yet. Your scores will show here after your first one. <Link href="/dashboard">Back to your dashboard</Link>
        </p>
      )}
    </div>
  );
}

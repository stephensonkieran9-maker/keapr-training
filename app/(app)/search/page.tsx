import Link from "next/link";
import { Icon, type IconName } from "@/components/Icons";
import { buildSearchIndex } from "@/lib/search-index";
import { groupHits, search, type SearchKind } from "@/lib/search";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ComingSoon } from "@/components/ComingSoon";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search · Keapr Training" };

const kindIcon: Record<SearchKind, IconName> = {
  page: "grid", course: "book", lesson: "play", resource: "pdf", help: "help", person: "users", "admin-course": "stack",
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  if (!isSupabaseConfigured()) return <ComingSoon title="Search" body="Search needs a signed-in account." />;
  const q = ((await searchParams).q ?? "").slice(0, 100).trim();
  const hits = q ? search(await buildSearchIndex(), q, 100) : [];
  const groups = groupHits(hits);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow"><b>Search</b></div>
          <h1>{q ? <>Results for &ldquo;{q}&rdquo;</> : "Search"}</h1>
          <p>{q ? `${hits.length} result${hits.length === 1 ? "" : "s"}` : "Type in the search box at the top (or press /)."}</p>
        </div>
      </div>

      <form className="card report-filters" method="get" action="/search" style={{ gridTemplateColumns: "1fr auto" }}>
        <label className="field">
          <span>Search</span>
          <input type="search" name="q" defaultValue={q} placeholder="Lessons, courses, downloads, help" />
        </label>
        <div className="actions-row"><button className="btn btn-primary btn-sm" type="submit">Search</button></div>
      </form>

      {q && hits.length === 0 && (
        <p className="empty">
          Nothing matches &ldquo;{q}&rdquo;. Try a shorter word, or check <Link href="/help">Help</Link>.
        </p>
      )}

      <div className="search-results">
        {groups.map((g) => (
          <section key={g.kind} className="card" aria-labelledby={`g-${g.kind}`}>
            <h2 id={`g-${g.kind}`}>{g.label} ({g.hits.length})</h2>
            <ul>
              {g.hits.map((h) => (
                <li key={`${h.kind}-${h.href}`}>
                  <Link href={h.href}>
                    <span className="search-icon" aria-hidden="true"><Icon name={h.locked ? "lock" : kindIcon[h.kind]} /></span>
                    <span className="search-text">
                      <span className="search-title">{h.title}</span>
                      {h.subtitle && <span className="search-sub">{h.subtitle}</span>}
                      {h.snippet && <span className="search-sub">{h.snippet}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

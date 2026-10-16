import Link from "next/link";
import { NewPathForm } from "@/components/admin/PathForms";
import { requireAdmin } from "@/lib/auth";
import { timed } from "@/lib/timing";
import { listPaths, pathsAvailable } from "@/lib/admin/paths";

export const dynamic = "force-dynamic";
export const metadata = { title: "Training paths · Keapr Training" };

export default async function PathsPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const [available, paths] = await timed("paths", () => Promise.all([pathsAvailable(), listPaths()]));

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow"><b>Admin</b></div>
          <h1>Training paths</h1>
          <p>A path is a set of courses in order, usually one per team. Assign a path to someone and they get its courses, each opening once the one before is finished.</p>
        </div>
      </div>

      {!available && <div className="notice error" role="alert">Run migration 0011_training_paths.sql in Supabase to turn on training paths.</div>}
      {sp.deleted && <div className="notice ok" role="status">Path deleted. People keep the courses it gave them.</div>}

      <div className="two-col">
        <div className="form-stack">
          {paths.length === 0 ? (
            <p className="empty">No paths yet. Create one for each team.</p>
          ) : (
            paths.map((p) => (
              <Link key={p.id} href={`/admin/paths/${p.id}`} className="card path-card">
                <div className="ov-card-head">
                  <h2 style={{ margin: 0 }}>{p.name}</h2>
                  <span className="hint">{p.memberCount} {p.memberCount === 1 ? "person" : "people"}</span>
                </div>
                {p.description && <p className="muted" style={{ margin: "6px 0 0", fontSize: 14 }}>{p.description}</p>}
                {p.courses.length ? (
                  <ol className="path-inline">
                    {p.courses.map((c) => <li key={c.courseId}>{c.title}{!c.published && " (draft)"}{c.archived && " (archived)"}</li>)}
                  </ol>
                ) : (
                  <p className="hint" style={{ margin: "8px 0 0" }}>No courses yet.</p>
                )}
              </Link>
            ))
          )}
        </div>
        {available && <NewPathForm />}
      </div>
    </>
  );
}

import Link from "next/link";
import type { Overview, EnrolmentState, MatrixCell } from "@/lib/admin/overview";
import { formatShortDate } from "@/lib/format";

const stateLabel: Record<EnrolmentState, string> = { completed: "Completed", in_progress: "In progress", not_started: "Not started" };

export function AdminOverview({ data, sample = false, staffHref = (id: string) => `/admin/staff/${id}` }: {
  data: Overview;
  sample?: boolean;
  staffHref?: (id: string) => string | null;
}) {
  const k = data.kpis;
  const delta = k.lessonsPassedThisWeek - k.lessonsPassedLastWeek;

  return (
    <div className="ov">
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <b>Admin</b> · Snapshot {formatShortDate(new Date().toISOString())}
            {sample && <> <span className="demo">Sample data</span></>}
          </div>
          <h1>Training overview</h1>
          <p>How everyone is getting on across their assigned courses.</p>
        </div>
      </div>

      {data.kpis.assignments === 0 ? (
        <div className="card empty">
          No courses have been assigned yet. Assign a course from the Staff page and progress will show up here.{" "}
          {!sample && <Link className="link" href="/demo/admin">See it with sample data</Link>}
        </div>
      ) : (
        <>
          {/* Headline */}
          <section className="ov-hero" aria-label="Headline figures">
            <div className="ov-ring-card">
              <Ring percent={k.completionRate} size={132} stroke={12} />
              <div>
                <div className="ov-hero-num">{k.completionRate}%</div>
                <div className="ov-hero-label">of assigned courses completed</div>
                <div className="ov-hero-sub">{k.completedAssignments} of {k.assignments} assignments</div>
              </div>
            </div>
            <div className="ov-tiles">
              <Tile label="Learners" value={`${k.learners}`} sub={`${k.signedIn} have signed in`} />
              <Tile
                label="Lessons passed this week"
                value={`${k.lessonsPassedThisWeek}`}
                sub={delta === 0 ? "Same as last week" : `${delta > 0 ? "+" : "−"}${Math.abs(delta)} vs last week`}
                tone={delta > 0 ? "up" : delta < 0 ? "down" : undefined}
              />
              <Tile label="Passed first time" value={k.firstTimePassRate === null ? "—" : `${k.firstTimePassRate}%`} sub="Quizzes passed on the first attempt" />
            </div>
          </section>

          {!data.hasActivity && !sample && (
            <div className="notice">
              No one has started a lesson yet, so most of this page is empty for now. <Link className="link" href="/demo/admin">See it with sample data</Link>
            </div>
          )}

          {/* Course progress */}
          <section className="card" aria-labelledby="ov-courses">
            <div className="ov-card-head">
              <h2 id="ov-courses">Progress by course</h2>
              <Legend items={[["done", "Completed"], ["prog", "In progress"], ["none", "Not started"]]} />
            </div>
            <div className="ov-bars">
              {data.courses.map((c) => (
                <div className="ov-bar-row" key={c.courseId}>
                  <div className="ov-bar-label">{c.title}</div>
                  <div className="ov-stack" role="img" aria-label={`${c.title}: ${c.completed} completed, ${c.inProgress} in progress, ${c.notStarted} not started`}>
                    {(["completed", "inProgress", "notStarted"] as const).map((key) =>
                      c[key] > 0 ? (
                        <span
                          key={key}
                          className={`seg seg-${key === "completed" ? "done" : key === "inProgress" ? "prog" : "none"}`}
                          style={{ flexGrow: c[key] }}
                          data-tip={`${key === "completed" ? "Completed" : key === "inProgress" ? "In progress" : "Not started"}: ${c[key]} of ${c.total}`}
                          tabIndex={0}
                        />
                      ) : null,
                    )}
                  </div>
                  <div className="ov-bar-val">{c.completed}/{c.total} done</div>
                </div>
              ))}
            </div>
          </section>

          {/* Staff snapshot */}
          <section className="card" aria-labelledby="ov-staff">
            <div className="ov-card-head">
              <h2 id="ov-staff">Everyone at a glance</h2>
              <Legend items={[["done", "Completed"], ["prog", "In progress"], ["none", "Not started"]]} />
            </div>
            <div className="table-wrap ov-matrix-wrap">
              <table className="table ov-matrix">
                <thead>
                  <tr>
                    <th>Person</th>
                    <th>Overall</th>
                    {data.matrixCourses.map((c) => <th key={c.courseId} className="ov-col">{c.title}</th>)}
                    <th>Last active</th>
                  </tr>
                </thead>
                <tbody>
                  {data.staff.map((s) => {
                    const href = staffHref(s.id);
                    return (
                      <tr key={s.id}>
                        <td>{href ? <Link className="rowlink" href={href}>{s.name}</Link> : <span className="rowlink">{s.name}</span>}</td>
                        <td>
                          <div className="ov-overall">
                            <span className="ov-mini"><i style={{ width: `${s.overallPercent}%` }} /></span>
                            <span>{s.overallPercent}%</span>
                          </div>
                        </td>
                        {data.matrixCourses.map((c) => (
                          <td key={c.courseId} className="ov-col">
                            <Cell cell={s.cells[c.courseId]} course={c.title} />
                          </td>
                        ))}
                        <td className="muted">{s.lastActiveAt ? formatShortDate(s.lastActiveAt) : "No activity"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <div className="two-col">
            {/* Where people get stuck */}
            <section className="card" aria-labelledby="ov-stuck">
              <div className="ov-card-head">
                <h2 id="ov-stuck">Where people get stuck</h2>
                <span className="hint">Failed quiz attempts, last 60 days</span>
              </div>
              {data.stuck.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>No failed quizzes yet.</p>
              ) : (
                <ol className="ov-stuck">
                  {data.stuck.map((l) => {
                    const max = data.stuck[0].failed;
                    return (
                      <li key={l.lessonId}>
                        <div className="ov-stuck-top">
                          <span className="ov-stuck-title">{l.lessonTitle}</span>
                          {l.learnersStuck > 0 && <span className="badge invited">{l.learnersStuck} still stuck</span>}
                        </div>
                        <div className="ov-stuck-bar">
                          <span className="ov-hbar" style={{ width: `${Math.max(6, (l.failed / max) * 80)}%` }} data-tip={`${l.failed} failed of ${l.attempts} attempts`} tabIndex={0} />
                          <span className="ov-hbar-val">{l.failed} failed</span>
                        </div>
                        <div className="hint">
                          {l.courseTitle}
                          {l.firstTimePassRate !== null && ` · ${l.firstTimePassRate}% pass first time`}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>

            {/* Needs attention */}
            <section className="card" aria-labelledby="ov-attn">
              <div className="ov-card-head">
                <h2 id="ov-attn">Needs a nudge</h2>
                <span className="hint">{data.attention.length} {data.attention.length === 1 ? "person" : "people"}</span>
              </div>
              {data.attention.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>Everyone is on track.</p>
              ) : (
                <ul className="ov-attn">
                  {data.attention.map((a) => {
                    const href = staffHref(a.personId);
                    return (
                      <li key={a.personId} className={`sev-${a.severity}`}>
                        <span className="ov-sev" aria-hidden="true">{a.severity === "serious" ? "!" : "•"}</span>
                        <div>
                          {href ? <Link className="rowlink" href={href}>{a.name}</Link> : <span className="rowlink">{a.name}</span>}
                          <div className="hint">
                            <span className="sr-only">{a.severity === "serious" ? "Serious: " : "Warning: "}</span>
                            {a.reason}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* Activity */}
          <section className="card" aria-labelledby="ov-activity">
            <div className="ov-card-head">
              <h2 id="ov-activity">Quiz activity, last 30 days</h2>
              <Legend items={[["done", "Passed"], ["fail", "Not passed"]]} />
            </div>
            <ActivityChart days={data.activity} />
          </section>
        </>
      )}
    </div>
  );
}

function Tile({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "up" | "down" }) {
  return (
    <div className="ov-tile">
      <div className="k">{label}</div>
      <div className="v">{value}</div>
      <div className={`s${tone ? ` ${tone}` : ""}`}>{sub}</div>
    </div>
  );
}

function Legend({ items }: { items: [string, string][] }) {
  return (
    <ul className="ov-legend">
      {items.map(([cls, label]) => (
        <li key={cls}><span className={`sw sw-${cls}`} aria-hidden="true" />{label}</li>
      ))}
    </ul>
  );
}

function Ring({ percent, size = 40, stroke = 5, cls = "done" }: { percent: number; size?: number; stroke?: number; cls?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, percent));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ring" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" strokeWidth={stroke} fill="none" />
      {p > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={`ring-fill ring-${cls}`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(p / 100) * c} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
    </svg>
  );
}

function Cell({ cell, course }: { cell?: MatrixCell; course: string }) {
  if (!cell) return <span className="ov-na" aria-label={`${course}: not assigned`}>–</span>;
  const cls = cell.state === "completed" ? "done" : cell.state === "in_progress" ? "prog" : "none";
  return (
    <span className="ov-cell" data-tip={`${stateLabel[cell.state]} · ${cell.passed} of ${cell.total} lessons`} tabIndex={0} aria-label={`${course}: ${stateLabel[cell.state]}, ${cell.passed} of ${cell.total} lessons`}>
      <Ring percent={cell.percent} size={34} stroke={4} cls={cls} />
      <span className="ov-cell-num">{cell.state === "completed" ? "✓" : `${cell.percent}%`}</span>
    </span>
  );
}

function ActivityChart({ days }: { days: { date: string; passed: number; failed: number }[] }) {
  const W = 720, H = 180, padL = 28, padB = 24, padT = 8;
  const max = Math.max(1, ...days.map((d) => d.passed + d.failed));
  const niceMax = max <= 4 ? max : Math.ceil(max / 2) * 2;
  const band = (W - padL) / days.length;
  const bw = Math.min(14, band - 4);
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / niceMax);
  const total = days.reduce((n, d) => n + d.passed + d.failed, 0);
  const ticks = [0, Math.round(niceMax / 2), niceMax].filter((v, i, a) => a.indexOf(v) === i);

  if (total === 0) return <p className="muted" style={{ margin: 0 }}>No quizzes taken in the last 30 days.</p>;

  return (
    <div className="ov-activity">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${total} quiz attempts in the last 30 days`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W} y1={y(t)} y2={y(t)} className="grid" />
            <text x={padL - 6} y={y(t) + 4} textAnchor="end" className="axis">{t}</text>
          </g>
        ))}
        {days.map((d, i) => {
          const x = padL + i * band + (band - bw) / 2;
          const yp = y(d.passed);
          const yf = y(d.passed + d.failed);
          const label = `${formatShortDate(d.date)}: ${d.passed} passed, ${d.failed} not passed`;
          return (
            <g key={d.date} className="col">
              <title>{label}</title>
              <rect x={padL + i * band} y={padT} width={band} height={H - padT - padB} className="hit" />
              {d.passed > 0 && <rect x={x} y={yp} width={bw} height={y(0) - yp} className="bar-done" rx={2} />}
              {d.failed > 0 && <rect x={x} y={yf} width={bw} height={Math.max(0, yp - yf - (d.passed > 0 ? 2 : 0))} className="bar-fail" rx={2} />}
            </g>
          );
        })}
        <text x={padL} y={H - 6} className="axis">{formatShortDate(days[0].date)}</text>
        <text x={W} y={H - 6} textAnchor="end" className="axis">Today</text>
      </svg>
    </div>
  );
}

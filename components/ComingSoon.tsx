import Link from "next/link";
import { AppShell } from "./AppShell";
import { getDashboardData } from "@/lib/data";

export async function ComingSoon({ title, body }: { title: string; body: string }) {
  const data = await getDashboardData();
  return (
    <AppShell learner={data.learner} active="training">
      <section className="panel">
        <div className="eyebrow"><b>Coming next</b></div>
        <h2 style={{ fontSize: 24, margin: "6px 0 10px" }}>{title}</h2>
        <p style={{ color: "var(--muted)", maxWidth: "60ch", margin: "0 0 18px" }}>{body}</p>
        <Link className="btn btn-primary" href="/dashboard">Back to dashboard</Link>
      </section>
    </AppShell>
  );
}

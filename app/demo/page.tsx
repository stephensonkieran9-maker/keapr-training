import { AppShell } from "@/components/AppShell";
import { DashboardView } from "@/components/DashboardView";
import { getDemoDashboard } from "@/lib/data";

// Public, read-only demo with labelled sample data. No sign-in needed,
// no real records shown. Useful for showing people what the app looks like.
export const metadata = { title: "Demo · Keapr Training" };

export default async function DemoPage() {
  const data = await getDemoDashboard();
  return (
    <AppShell learner={data.learner} demoMode>
      <DashboardView data={data} />
    </AppShell>
  );
}

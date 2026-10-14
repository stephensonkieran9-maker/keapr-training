import { AppShell } from "@/components/AppShell";
import { AdminOverview } from "@/components/admin/Overview";
import { computeOverview } from "@/lib/admin/overview";
import { sampleOverviewInput } from "@/lib/admin/overview-sample";
import { demoDashboard } from "@/lib/demo-data";

// Public preview of the admin overview with invented sample data.
export const dynamic = "force-dynamic";
export const metadata = { title: "Admin overview demo · Keapr Training" };

export default function DemoAdminPage() {
  return (
    <AppShell learner={demoDashboard.learner} demoMode>
      <AdminOverview data={computeOverview(sampleOverviewInput())} sample staffHref={() => null} />
    </AppShell>
  );
}

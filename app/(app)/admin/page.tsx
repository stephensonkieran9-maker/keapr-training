import { AdminOverview } from "@/components/admin/Overview";
import { requireAdmin } from "@/lib/auth";
import { computeOverview } from "@/lib/admin/overview";
import { loadOverviewInput } from "@/lib/admin/overview-data";
import { timed } from "@/lib/timing";

export const dynamic = "force-dynamic";
export const metadata = { title: "Overview · Keapr Training" };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const input = await timed("overview data", () => loadOverviewInput());
  return <AdminOverview data={computeOverview(input)} />;
}

import { DashboardView } from "@/components/DashboardView";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard · Keapr Training" };

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardView data={data} />;
}

import { InviteForm } from "@/components/admin/InviteForm";
import { StaffTable } from "@/components/admin/StaffTable";
import { requireAdmin } from "@/lib/auth";
import { timed } from "@/lib/timing";
import { listStaff } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Staff · Keapr Training" };

export default async function StaffPage() {
  await requireAdmin();
  const staff = await timed("staff list", () => listStaff());
  const counts = {
    active: staff.filter((s) => s.status === "active").length,
    invited: staff.filter((s) => s.status === "invited").length,
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow"><b>Admin</b></div>
          <h1>Staff</h1>
          <p>{staff.length} {staff.length === 1 ? "person" : "people"} · {counts.active} active · {counts.invited} yet to sign in</p>
        </div>
      </div>

      <div className="two-col">
        <div className="table-wrap">
          <StaffTable staff={staff} />
        </div>
        <InviteForm />
      </div>
    </>
  );
}

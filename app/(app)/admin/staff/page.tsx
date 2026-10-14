import Link from "next/link";
import { InviteForm } from "@/components/admin/InviteForm";
import { requireAdmin } from "@/lib/auth";
import { listStaff, type StaffStatus } from "@/lib/admin/queries";
import { formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Staff · Keapr Training" };

const statusLabel: Record<StaffStatus, string> = { active: "Active", invited: "Invited", deactivated: "Deactivated" };

export default async function StaffPage() {
  const { profile } = await requireAdmin();
  const staff = await listStaff();
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
          {staff.length === 0 ? (
            <p className="empty">No one here yet. Add someone to get started.</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Role</th><th>Status</th><th>Courses</th><th>Last sign-in</th></tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link className="rowlink" href={`/admin/staff/${s.id}`}>{s.fullName}</Link>
                      <small>{s.email}</small>
                    </td>
                    <td><span className={`badge ${s.role}`}>{s.role === "admin" ? "Admin" : "Learner"}</span></td>
                    <td><span className={`badge ${s.status}`}>{statusLabel[s.status]}</span></td>
                    <td>{s.assignedCount ? `${s.completedCount} of ${s.assignedCount} done` : "None"}</td>
                    <td>{s.lastSignInAt ? formatShortDate(s.lastSignInAt) : "Never"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <InviteForm />
      </div>
    </>
  );
}

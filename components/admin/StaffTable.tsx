"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { StaffRow, StaffStatus } from "@/lib/admin/queries";
import { formatWhen } from "@/lib/format";

const statusLabel: Record<StaffStatus, string> = { active: "Active", invited: "Invited", deactivated: "Deactivated" };

export function StaffTable({ staff }: { staff: StaffRow[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | StaffStatus>("");
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return staff.filter(
      (s) => (!status || s.status === status) && (!term || s.fullName.toLowerCase().includes(term) || s.email.toLowerCase().includes(term)),
    );
  }, [staff, q, status]);

  if (staff.length === 0) return <p className="empty">No one here yet. Add someone to get started.</p>;

  return (
    <>
      <div className="table-tools">
        <input className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" aria-label="Search staff" />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value as "" | StaffStatus)} aria-label="Filter by status">
          <option value="">Everyone</option>
          <option value="active">Active</option>
          <option value="invited">Invited</option>
          <option value="deactivated">Deactivated</option>
        </select>
        {(q || status) && <span className="muted" style={{ fontSize: 13 }}>{shown.length} of {staff.length}</span>}
      </div>
      {shown.length === 0 ? (
        <p className="empty">No one matches.</p>
      ) : (
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Role</th><th>Status</th><th>Courses</th><th>Last active</th></tr>
          </thead>
          <tbody>
            {shown.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link className="rowlink" href={`/admin/staff/${s.id}`}>{s.fullName}</Link>
                  <small>{s.email}</small>
                </td>
                <td><span className={`badge ${s.role}`}>{s.role === "admin" ? "Admin" : "Learner"}</span></td>
                <td><span className={`badge ${s.status}`}>{statusLabel[s.status]}</span></td>
                <td>{s.assignedCount ? `${s.completedCount} of ${s.assignedCount} done` : "None"}</td>
                <td>{s.lastSignInAt ? formatWhen(s.lastSignInAt) : "Never"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

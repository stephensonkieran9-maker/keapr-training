import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { timed } from "@/lib/timing";
import { getEnrolmentDetail } from "@/lib/admin/attempt-detail-data";
import { EnrolmentDetailView } from "@/components/admin/EnrolmentDetailView";
import { createAdminClient } from "@/lib/supabase/admin";
import { groupChecklist, loadChecklist } from "@/lib/checklist";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Course detail · Keapr Training" };

export default async function EnrolmentDetailPage({ params }: { params: Promise<{ id: string; enrolmentId: string }> }) {
  await requireAdmin();
  const { id, enrolmentId } = await params;
  const d = await timed("enrolment detail", () => getEnrolmentDetail(enrolmentId));
  if (!d || d.learnerId !== id) notFound();
  const admin = createAdminClient();
  const { data: enrolment } = await admin.from("enrolments").select("course_version_id").eq("id", enrolmentId).maybeSingle();
  const checklist = enrolment ? await loadChecklist(admin, enrolment.course_version_id, enrolmentId) : [];
  const done = checklist.filter((i) => i.tickedAt).length;
  return (
    <>
      <EnrolmentDetailView d={d} staffId={id} />
      {checklist.length > 0 && (
        <section className="card" aria-labelledby="checklist-title" style={{ marginTop: 16 }}>
          <h2 id="checklist-title" style={{ marginTop: 0 }}>Checklist · {done} of {checklist.length} ticked</h2>
          {groupChecklist(checklist).map((sec, si) => (
            <div key={si} style={{ marginTop: si ? 14 : 8 }}>
              {sec.title && <h3 style={{ fontSize: 14, margin: "0 0 6px" }}>{sec.title}</h3>}
              <ul className="checklist-ticks">
                {sec.items.map((i) => (
                  <li key={i.id} className={i.tickedAt ? "ok" : "no"}>
                    <span className="mark" aria-hidden="true">{i.tickedAt ? "✓" : "–"}</span>
                    <span>
                      {i.label}
                      {i.tickedAt && <span className="muted"> · ticked {formatDateTime(i.tickedAt)}</span>}
                      <span className="sr-only">{i.tickedAt ? " (ticked)" : " (not ticked)"}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
    </>
  );
}

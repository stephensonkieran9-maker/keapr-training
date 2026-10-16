import Link from "next/link";
import { Icon, type IconName } from "./Icons";
import type { Resource } from "@/lib/types";

const kindIcon: Record<Resource["kind"], IconName> = {
  pdf: "pdf",
  doc: "book",
  checklist: "checklist",
};

export function ResourceList({ resources }: { resources: Resource[] }) {
  return (
    <section id="resources" aria-labelledby="res-title">
      <div className="sec-head">
        <div>
          <h2 id="res-title">Supporting resources</h2>
          <p>Handbooks and checklists attached to your courses.</p>
        </div>
      </div>
      {resources.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No resources yet.</p>
      ) : (
        <div className="res">
          {resources.map((r) => (
            <div className="file" key={r.id}>
              <span className="fi"><Icon name={kindIcon[r.kind]} /></span>
              <div>
                <b>{r.title}</b>
                {r.sizeLabel && <small>{r.sizeLabel}</small>}
              </div>
              <Link className="btn btn-soft btn-sm" href={r.href}>Open</Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

import "server-only";
import { createAdminClient } from "./supabase/admin";

export interface SignedDownload {
  id: string;
  title: string;
  kind: string;
  href: string | null;
  sizeLabel?: string;
}

const LINK_SECONDS = 60 * 60; // links last an hour; a page reload makes fresh ones

function fileName(title: string, path: string): string {
  const ext = path.split(".").pop();
  const base = title.replace(/[^\w\s.-]+/g, "").trim().replace(/\s+/g, " ") || "download";
  return ext && !base.toLowerCase().endsWith(`.${ext.toLowerCase()}`) ? `${base}.${ext}` : base;
}

function sizeLabel(bytes: number | null | undefined, kind: string): string | undefined {
  if (!bytes) return undefined;
  const size = bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${kind === "other" ? "File" : kind.toUpperCase()} · ${size}`;
}

/** Short-lived download links for files in the private lesson-files bucket.
 * Callers decide who may have them (e.g. only unlocked lessons). */
export async function signDownloads(items: { id: string; title: string; kind: string; path: string; sizeBytes?: number | null }[]): Promise<SignedDownload[]> {
  if (!items.length) return [];
  const bucket = createAdminClient().storage.from("lesson-files");
  return Promise.all(
    items.map(async (it) => {
      const { data } = await bucket.createSignedUrl(it.path, LINK_SECONDS, { download: fileName(it.title, it.path) });
      return { id: it.id, title: it.title, kind: it.kind, href: data?.signedUrl ?? null, sizeLabel: sizeLabel(it.sizeBytes, it.kind) };
    }),
  );
}

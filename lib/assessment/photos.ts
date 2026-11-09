import "server-only";
import { createHash } from "node:crypto";
import { zipSync } from "fflate";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PhotoKey } from "./scoring";

export const PHOTO_BUCKET = "assessment-photos";
const LINK_SECONDS = 5 * 60 * 60; // longer than the longest time limit

export const sha256Hex = (buf: Uint8Array) => createHash("sha256").update(buf).digest("hex");

/** Thumbnail links, keyed by photo hash. Only call for someone allowed to
 * see these photos (an admin, or a candidate whose test is running). */
export async function signPhotoUrls(photos: PhotoKey[]): Promise<Record<string, string>> {
  if (!photos.length) return {};
  const { data } = await createAdminClient().storage.from(PHOTO_BUCKET).createSignedUrls(photos.map((p) => p.path), LINK_SECONDS);
  const out: Record<string, string> = {};
  photos.forEach((p, i) => {
    const url = data?.[i]?.signedUrl;
    if (url) out[p.hash] = url;
  });
  return out;
}

/** All the photos in one zip, in a shuffled order with neutral names
 * (photo-01.jpg…), so neither the order nor the names give the answer away.
 * Files are stored uncompressed and byte-for-byte, so a re-upload matches. */
export async function photoZip(photos: PhotoKey[], seed: string): Promise<Uint8Array> {
  const bucket = createAdminClient().storage.from(PHOTO_BUCKET);
  const shuffled = [...photos].sort((a, b) => sha256Hex(Buffer.from(seed + a.hash)).localeCompare(sha256Hex(Buffer.from(seed + b.hash))));
  const files: Record<string, [Uint8Array, { level: 0 }]> = {};
  await Promise.all(shuffled.map(async (p, i) => {
    const { data, error } = await bucket.download(p.path);
    if (error || !data) throw new Error(`Couldn't read photo ${p.name}`);
    const ext = (p.path.split(".").pop() ?? "jpg").toLowerCase();
    files[`photo-${String(i + 1).padStart(2, "0")}.${ext}`] = [new Uint8Array(await data.arrayBuffer()), { level: 0 }];
  }));
  return zipSync(files);
}

export function zipResponse(zip: Uint8Array, name: string): Response {
  return new Response(zip as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

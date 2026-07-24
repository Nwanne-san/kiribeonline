import { getPayloadClient } from "@/lib/payload/get-payload";
import { mapPayloadMedia } from "./map-article";
import type { PublicReel } from "./query-homepage";

const MAX_LIMIT = 100;

function mapReelDoc(doc: Record<string, unknown>): PublicReel {
  const thumbRaw = doc.thumbnail;
  const thumbnail =
    thumbRaw && typeof thumbRaw === "object"
      ? mapPayloadMedia(thumbRaw as never)
      : undefined;
  return {
    id: String(doc.id),
    title: String(doc.title ?? ""),
    label: String(doc.label ?? ""),
    platform: String(doc.platform ?? ""),
    externalUrl: String(doc.externalUrl ?? ""),
    thumbnail,
  };
}

/**
 * Public reels feed — powers `/categories/videos`. Reels marked
 * `published=false` are hidden (matches the collection's read access) and
 * `sortOrder` DESC lets editors pin latest at the top.
 */
export async function getPublishedReels(limit = 48): Promise<PublicReel[]> {
  const payload = await getPayloadClient();
  const capped = Math.min(Math.max(limit, 1), MAX_LIMIT);
  try {
    const result = await payload.find({
      collection: "reels",
      where: { published: { equals: true } },
      sort: ["-sortOrder", "-updatedAt"],
      limit: capped,
      depth: 1,
    });
    return result.docs.map((doc) =>
      mapReelDoc(doc as unknown as Record<string, unknown>)
    );
  } catch (err) {
    console.warn("[reels] getPublishedReels failed:", err);
    return [];
  }
}

import { getPayloadClient } from "@/lib/payload/get-payload";
import { resolveMediaUrl } from "@/lib/storage/media-url";
import { clampLimit, normalizePagination, parsePage } from "@/lib/content";
import type { AdminListResult } from "@/server/shared/types";
import type { AdminMediaItem } from "./media.types";

type MediaDoc = {
  id: string | number;
  url?: string | null;
  filename?: string | null;
  alt?: string | null;
  caption?: string | null;
  credit?: string | null;
  width?: number | null;
  height?: number | null;
  usageCount?: number | null;
  updatedAt: string;
};

function mapMedia(doc: MediaDoc): AdminMediaItem {
  return {
    id: String(doc.id),
    url: resolveMediaUrl(doc as { url?: string | null; filename?: string | null }),
    filename: doc.filename ?? undefined,
    alt: doc.alt ?? undefined,
    caption: doc.caption ?? undefined,
    credit: doc.credit ?? undefined,
    width: doc.width ?? undefined,
    height: doc.height ?? undefined,
    usageCount: doc.usageCount ?? 0,
    updatedAt: doc.updatedAt,
  };
}

export type ListMediaParams = {
  page?: number | string;
  limit?: number | string;
};

export async function listMedia(
  params: ListMediaParams = {}
): Promise<AdminListResult<AdminMediaItem>> {
  const payload = await getPayloadClient();
  const page = parsePage(params.page);
  const limit = clampLimit(params.limit);

  const result = await payload.find({
    collection: "media",
    page,
    limit,
    sort: "-updatedAt",
    depth: 0,
    overrideAccess: true,
  });

  return {
    docs: (result.docs as MediaDoc[]).map(mapMedia),
    ...normalizePagination(result.totalDocs, page, limit),
  };
}

export type CreateMediaInput = {
  buffer: Buffer;
  filename: string;
  mimetype: string;
  size: number;
  alt: string;
  caption?: string;
  credit?: string;
};

export async function createMedia(
  input: CreateMediaInput
): Promise<AdminMediaItem> {
  const payload = await getPayloadClient();
  const doc = await payload.create({
    collection: "media",
    data: {
      alt: input.alt,
      caption: input.caption || undefined,
      credit: input.credit || undefined,
    } as never,
    file: {
      data: input.buffer,
      mimetype: input.mimetype,
      name: input.filename,
      size: input.size,
    },
    overrideAccess: true,
  });
  return mapMedia(doc as MediaDoc);
}

export type MediaReference = { type: string; title: string };

/** Max references we surface per collection — enough to be actionable without
 *  scanning the whole table. */
const REFERENCE_SCAN_LIMIT = 25;

/**
 * Find the content that still points at a media asset, so deletion can be
 * blocked with a clear message instead of leaving broken images behind.
 *
 * Covers the directly-queryable upload relationships: article hero + social
 * image, reel thumbnails, and creator portraits. Body-embedded images inside
 * Lexical richtext are not columns and aren't scanned here (a known gap —
 * see PLAN-IMAGES Phase E).
 */
export async function findMediaReferences(id: string): Promise<MediaReference[]> {
  const payload = await getPayloadClient();
  const numeric = Number(id);
  const idValue: string | number = Number.isNaN(numeric) ? id : numeric;

  const [articles, reels, creators] = await Promise.all([
    payload.find({
      collection: "articles",
      where: {
        or: [{ heroImage: { equals: idValue } }, { "seo.ogImage": { equals: idValue } }],
      },
      depth: 0,
      limit: REFERENCE_SCAN_LIMIT,
      overrideAccess: true,
    }),
    payload.find({
      collection: "reels",
      where: { thumbnail: { equals: idValue } },
      depth: 0,
      limit: REFERENCE_SCAN_LIMIT,
      overrideAccess: true,
    }),
    payload.find({
      collection: "creators",
      where: { portrait: { equals: idValue } },
      depth: 0,
      limit: REFERENCE_SCAN_LIMIT,
      overrideAccess: true,
    }),
  ]);

  const refs: MediaReference[] = [];
  for (const doc of articles.docs) {
    refs.push({ type: "Article", title: (doc as { title?: string }).title ?? "Untitled" });
  }
  for (const doc of reels.docs) {
    refs.push({ type: "Reel", title: (doc as { title?: string }).title ?? "Untitled" });
  }
  for (const doc of creators.docs) {
    refs.push({ type: "Creator", title: (doc as { name?: string }).name ?? "Unnamed" });
  }
  return refs;
}

export async function deleteMedia(id: string): Promise<void> {
  const payload = await getPayloadClient();
  await payload.delete({ collection: "media", id, overrideAccess: true });
}

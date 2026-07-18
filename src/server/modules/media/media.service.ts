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

export async function deleteMedia(id: string): Promise<void> {
  const payload = await getPayloadClient();
  await payload.delete({ collection: "media", id, overrideAccess: true });
}

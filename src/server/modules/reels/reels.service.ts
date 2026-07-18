import { getPayloadClient } from "@/lib/payload/get-payload";
import { slugify } from "@/utils/helper";

export type ReelInput = {
  title: string;
  slug?: string;
  label: string;
  platform: "instagram" | "tiktok" | "youtube";
  thumbnailId: string | number;
  externalUrl: string;
  published?: boolean;
  sortOrder?: number;
};

export async function listReelsAdmin() {
  const payload = await getPayloadClient();
  return payload.find({ collection: "reels", sort: "sortOrder", limit: 100, depth: 1, overrideAccess: true });
}

export async function getReelAdmin(id: string) {
  const payload = await getPayloadClient();
  return payload.findByID({ collection: "reels", id, depth: 2, overrideAccess: true });
}

export async function createReelAdmin(input: ReelInput) {
  const payload = await getPayloadClient();
  return payload.create({
    collection: "reels",
    data: {
      title: input.title,
      slug: input.slug ?? slugify(input.title),
      label: input.label,
      platform: input.platform,
      thumbnail: input.thumbnailId,
      externalUrl: input.externalUrl,
      published: input.published ?? true,
      sortOrder: input.sortOrder ?? 0,
    } as never,
    overrideAccess: true,
  });
}

export async function updateReelAdmin(id: string, input: Partial<ReelInput>) {
  const payload = await getPayloadClient();
  const data: Record<string, unknown> = {};
  if (input.title) data.title = input.title;
  if (input.slug) data.slug = input.slug;
  if (input.label) data.label = input.label;
  if (input.platform) data.platform = input.platform;
  if (input.thumbnailId) data.thumbnail = input.thumbnailId;
  if (input.externalUrl) data.externalUrl = input.externalUrl;
  if (input.published !== undefined) data.published = input.published;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
  return payload.update({ collection: "reels", id, data, overrideAccess: true });
}

export async function deleteReelAdmin(id: string) {
  const payload = await getPayloadClient();
  return payload.delete({ collection: "reels", id, overrideAccess: true });
}

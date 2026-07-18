import { getPayloadClient } from "@/lib/payload/get-payload";
import type { tagInputSchema } from "./tags.dto";
import type { AdminTag } from "./tags.types";
import type { z } from "zod";

type TagInput = z.infer<typeof tagInputSchema>;

type TagDoc = {
  id: string | number;
  name: string;
  slug: string;
  brandColor?: string | null;
  isSystem?: boolean | null;
  updatedAt: string;
};

/**
 * List tags alphabetically, each enriched with the number of articles
 * referencing it. Counts are batched in parallel via payload.count.
 */
export async function listTags(): Promise<{ docs: AdminTag[] }> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "tags",
    sort: "name",
    limit: 200,
    overrideAccess: true,
  });

  const docs = await Promise.all(
    (result.docs as TagDoc[]).map(async (doc) => {
      const count = await payload.count({
        collection: "articles",
        where: { tags: { contains: doc.id } },
        overrideAccess: true,
      });
      return {
        id: String(doc.id),
        name: doc.name,
        slug: doc.slug,
        brandColor: doc.brandColor ?? undefined,
        isSystem: doc.isSystem ?? undefined,
        articleCount: count.totalDocs,
        updatedAt: doc.updatedAt,
      } satisfies AdminTag;
    })
  );

  return { docs };
}

export async function createTag(input: TagInput) {
  const payload = await getPayloadClient();
  return payload.create({
    collection: "tags",
    data: input as never,
    overrideAccess: true,
  });
}

export async function deleteTag(id: string) {
  const payload = await getPayloadClient();
  await payload.delete({ collection: "tags", id, overrideAccess: true });
  return { deleted: true };
}

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

/**
 * Delete a tag and remove its reference from every article that carries it.
 *
 * Payload doesn't cascade many-to-many joins, so a naïve `payload.delete` would
 * leave orphaned rows in the join table (or, worse, articles with a stale
 * relationship pointing at nothing). We fetch every article carrying the tag,
 * rewrite each `tags[]` array minus the deleted id, then delete the tag. If any
 * article update fails, we abort before the delete so the join stays coherent.
 *
 * Tags aren't structural — no status changes on the article, only the tag
 * chip disappears.
 */
export async function deleteTag(id: string) {
  const payload = await getPayloadClient();

  const impacted = await payload.find({
    collection: "articles",
    where: { tags: { contains: id } },
    limit: 10_000,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });

  for (const article of impacted.docs) {
    const nextTags = ((article as { tags?: Array<string | number | { id: string | number }> }).tags ?? [])
      .map((t) => (typeof t === "object" && t !== null ? t.id : t))
      .filter((tid) => String(tid) !== String(id));
    await payload.update({
      collection: "articles",
      id: article.id,
      data: { tags: nextTags as never },
      overrideAccess: true,
    });
  }

  await payload.delete({ collection: "tags", id, overrideAccess: true });
  return { deleted: true, articlesUpdated: impacted.docs.length };
}

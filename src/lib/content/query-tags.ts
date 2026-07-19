import { unstable_cache } from "next/cache";
import { getPayloadClient } from "@/lib/payload/get-payload";

export type PublicTag = {
  id: string;
  name: string;
  slug: string;
};

async function fetchTagBySlugUncached(slug: string): Promise<PublicTag | null> {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "tags",
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    });
    const doc = result.docs[0];
    if (!doc) return null;
    return {
      id: String(doc.id),
      name: doc.name as string,
      slug: doc.slug as string,
    };
  } catch {
    // On a transient Payload/DB error, return null so the caller renders a
    // 404 rather than a stack trace. A genuinely missing tag is the common case.
    return null;
  }
}

/**
 * Resolve a tag by slug for public archive pages. Used to distinguish a real
 * (possibly empty) tag from a junk slug so the latter can 404 instead of
 * rendering an empty archive with a 200.
 */
export const getTagBySlug = unstable_cache(fetchTagBySlugUncached, ["tag-by-slug"], {
  tags: ["tags"],
  revalidate: 60,
});

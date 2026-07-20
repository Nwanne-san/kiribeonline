import { getPayloadClient } from "@/lib/payload/get-payload";

/** Shape of a single article as it appears in the RSS feed. */
export type FeedArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt?: string;
  updatedAt?: string;
  primaryCategory?: { name: string; slug: string };
};

/**
 * Latest published articles for the public RSS feed. Card-shaped payload —
 * excludes the Lexical body deliberately so `/feed.xml` stays a discovery
 * teaser (title + excerpt + link), not a syndication mirror of full articles.
 *
 * Sort matches the site (`-publishedAt`) so the newest article appears first
 * in the feed. Category is depth-1 populated to satisfy `<category>`.
 */
export async function queryArticlesForFeed(limit = 30): Promise<FeedArticle[]> {
  try {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: "articles",
      where: { status: { equals: "published" } },
      sort: "-publishedAt",
      limit,
      depth: 1,
      overrideAccess: true,
    });

    return docs.map((doc) => {
      const rawCategories = (doc as { categories?: unknown }).categories;
      const primary = Array.isArray(rawCategories) ? rawCategories[0] : undefined;
      const category =
        primary && typeof primary === "object"
          ? (primary as { name?: string; slug?: string })
          : undefined;

      return {
        id: String(doc.id),
        title: String(doc.title ?? ""),
        slug: String(doc.slug ?? ""),
        excerpt: (doc as { excerpt?: string | null }).excerpt ?? undefined,
        publishedAt: (doc as { publishedAt?: string | null }).publishedAt ?? undefined,
        updatedAt: (doc as { updatedAt?: string | null }).updatedAt ?? undefined,
        primaryCategory:
          category?.name && category?.slug
            ? { name: category.name, slug: category.slug }
            : undefined,
      };
    });
  } catch (err) {
    console.error("[feed] failed to load articles, returning empty feed", err);
    return [];
  }
}

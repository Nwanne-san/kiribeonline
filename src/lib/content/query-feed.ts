import { getPayloadClient } from "@/lib/payload/get-payload";
import { getSiteBaseUrl } from "@/lib/seo/site-url";

/**
 * The lean shape the RSS renderer needs — title, canonical link, publish date,
 * optional excerpt, and the first category slug/name for `<category>`. We
 * intentionally do NOT include the article body; the feed is a summary feed by
 * design so readers click through to the site.
 */
export type FeedItem = {
  title: string;
  url: string;
  slug: string;
  publishedAt?: string;
  description?: string;
  categoryName?: string;
  categorySlug?: string;
};

const FEED_ITEM_LIMIT = 30;

/**
 * Pull the latest ~30 published articles for the RSS feed. Payload depth 1 so
 * the first category object arrives populated (we only need name + slug for
 * the `<category>` element).
 *
 * Best-effort like the sitemap: on a Payload/DB failure we return an empty
 * array so the feed still validates rather than 500ing.
 */
export async function getFeedItems(): Promise<FeedItem[]> {
  try {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: "articles",
      where: { status: { equals: "published" } },
      sort: "-publishedAt",
      limit: FEED_ITEM_LIMIT,
      depth: 1,
      overrideAccess: true,
    });

    const baseUrl = getSiteBaseUrl();

    return docs.map((doc) => {
      const first = Array.isArray(doc.categories) ? doc.categories[0] : undefined;
      const category =
        first && typeof first === "object"
          ? (first as { name?: string | null; slug?: string | null })
          : undefined;

      return {
        title: String(doc.title ?? ""),
        slug: String(doc.slug ?? ""),
        url: `${baseUrl}/articles/${doc.slug}`,
        publishedAt:
          (doc.publishedAt as string | undefined) ??
          (doc.updatedAt as string | undefined) ??
          undefined,
        description: doc.excerpt ? String(doc.excerpt) : undefined,
        categoryName: category?.name ?? undefined,
        categorySlug: category?.slug ?? undefined,
      };
    });
  } catch (err) {
    console.error("[feed] failed to load articles for RSS", err);
    return [];
  }
}

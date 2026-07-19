import { unstable_cache } from "next/cache";
import { ARTICLE_LIST_SORT } from "@/constants";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { buildArticleWhere } from "./article-filters";

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  brandColor?: string | null;
  showInNav?: boolean | null;
};

/** A category enriched with counts + a teaser for the categories index page. */
export type PublicCategorySummary = PublicCategory & {
  description?: string | null;
  /** Published article count for this category. */
  articleCount: number;
  /** Title of the most recent published article, if any. */
  latestArticleTitle?: string | null;
};

async function fetchCategoriesUncached(): Promise<PublicCategory[]> {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "categories",
      sort: "displayOrder",
      limit: 50,
      depth: 0,
    });
    return result.docs.map((doc) => ({
      id: String(doc.id),
      name: doc.name as string,
      slug: doc.slug as string,
      brandColor: (doc as { brandColor?: string }).brandColor,
      showInNav: (doc as { showInNav?: boolean }).showInNav,
    }));
  } catch {
    return [];
  }
}

export const getCategoriesForPublic = unstable_cache(
  fetchCategoriesUncached,
  ["categories-public"],
  { tags: ["categories"], revalidate: 60 }
);

async function fetchCategoriesIndexUncached(): Promise<PublicCategorySummary[]> {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "categories",
      // Respect the admin's visibility toggle — hidden categories stay off the
      // browse surface just like they're kept out of the header nav.
      where: { showInNav: { not_equals: false } },
      sort: "displayOrder",
      limit: 50,
      depth: 0,
    });

    // One lightweight query per category (a handful at most). A `limit: 1` find
    // returns both `totalDocs` (the published count) and the latest headline in
    // a single round-trip, so we avoid a separate count + teaser fetch and never
    // fan out into an N+1 over articles.
    return await Promise.all(
      result.docs.map(async (doc) => {
        const slug = doc.slug as string;
        const articles = await payload.find({
          collection: "articles",
          where: buildArticleWhere({ categorySlug: slug }),
          sort: ARTICLE_LIST_SORT,
          limit: 1,
          depth: 0,
        });

        return {
          id: String(doc.id),
          name: doc.name as string,
          slug,
          brandColor: (doc as { brandColor?: string }).brandColor,
          showInNav: (doc as { showInNav?: boolean }).showInNav,
          description: (doc as { description?: string }).description ?? null,
          articleCount: articles.totalDocs,
          latestArticleTitle:
            (articles.docs[0]?.title as string | undefined) ?? null,
        } satisfies PublicCategorySummary;
      })
    );
  } catch {
    return [];
  }
}

const cachedCategoriesIndex = unstable_cache(
  fetchCategoriesIndexUncached,
  ["categories-index-public"],
  // Invalidated by the `articles` tag (counts + teasers) and refreshed on a
  // short timer for category edits, mirroring `getCategoriesForPublic`.
  { tags: ["categories", "articles"], revalidate: 60 }
);

/**
 * Categories with per-category article counts and a latest-headline teaser for
 * the public `/categories` index. Dev bypasses the data cache for instant
 * iteration; prod/staging go through tag-based `unstable_cache` invalidation.
 */
export async function getCategoriesIndexForPublic(): Promise<
  PublicCategorySummary[]
> {
  if (process.env.NODE_ENV === "development") {
    return fetchCategoriesIndexUncached();
  }
  return cachedCategoriesIndex();
}

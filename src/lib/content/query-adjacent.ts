import type { Where } from "payload";
import { getPayloadClient } from "@/lib/payload/get-payload";

/**
 * Compact adjacent-article summary — the prev/next footer only needs a title
 * and a slug. We deliberately don't return anything heavier so the query is
 * cheap and cacheable.
 */
export type AdjacentArticle = {
  id: string;
  title: string;
  slug: string;
};

export type AdjacentArticles = {
  prev: AdjacentArticle | null;
  next: AdjacentArticle | null;
};

export type AdjacentSourceArticle = {
  id: string | number;
  publishedAt?: string | null;
  categories?: Array<{ id?: string | number; slug?: string } | string | null> | null;
};

function firstCategory(article: AdjacentSourceArticle): { id?: string | number; slug?: string } | undefined {
  const first = (article.categories ?? [])[0];
  if (!first) return undefined;
  if (typeof first === "string" || typeof first === "number") {
    return { id: first };
  }
  return first;
}

/**
 * Chronological previous/next articles relative to `article.publishedAt`.
 *
 * - **prev** = the most recent published article strictly older than this one
 *   (`publishedAt < source`, sorted `-publishedAt`, limit 1).
 * - **next** = the oldest published article strictly newer than this one
 *   (`publishedAt > source`, sorted `+publishedAt`, limit 1).
 *
 * Scope: the source article's primary category first. If either slot is empty
 * inside the category (e.g. this is the newest article in Film), we fall back
 * to site-wide chronological to keep the footer functional.
 *
 * Cost: at most four bounded `find` calls of `limit: 1`, `depth: 0`. Cheap
 * enough to run on every article-detail render.
 */
export async function getAdjacentArticles(
  article: AdjacentSourceArticle
): Promise<AdjacentArticles> {
  const publishedAt = article.publishedAt ?? null;
  if (!publishedAt) {
    // Without a published-at anchor we can't order deterministically.
    return { prev: null, next: null };
  }

  try {
    const payload = await getPayloadClient();
    const sourceId = String(article.id);
    const cat = firstCategory(article);
    let categoryId = cat?.id;
    if (!categoryId && cat?.slug) {
      const catDoc = await payload.find({
        collection: "categories",
        where: { slug: { equals: cat.slug } },
        limit: 1,
        depth: 0,
      });
      categoryId = catDoc.docs[0]?.id;
    }

    const baseNotSelf: Where = { id: { not_equals: sourceId } };
    const published: Where = { status: { equals: "published" } };

    async function findOne(
      direction: "prev" | "next",
      withinCategory: boolean
    ): Promise<AdjacentArticle | null> {
      const timeClause: Where =
        direction === "prev"
          ? { publishedAt: { less_than: publishedAt } }
          : { publishedAt: { greater_than: publishedAt } };

      const conditions: Where[] = [published, baseNotSelf, timeClause];
      if (withinCategory && categoryId) {
        conditions.push({ categories: { equals: categoryId } });
      }

      const res = await payload.find({
        collection: "articles",
        where: { and: conditions },
        sort: direction === "prev" ? "-publishedAt" : "publishedAt",
        limit: 1,
        depth: 0,
      });
      const doc = res.docs[0] as
        | { id: string | number; title?: string; slug?: string }
        | undefined;
      if (!doc || !doc.title || !doc.slug) return null;
      return { id: String(doc.id), title: doc.title, slug: doc.slug };
    }

    // Try category-scoped first, fall back to site-wide per slot so an article
    // at the edge of its category still gets a functional footer nav.
    let prev = categoryId ? await findOne("prev", true) : null;
    if (!prev) prev = await findOne("prev", false);

    let next = categoryId ? await findOne("next", true) : null;
    if (!next) next = await findOne("next", false);

    return { prev, next };
  } catch (err) {
    console.warn("[adjacent] payload fetch failed, returning empty:", err);
    return { prev: null, next: null };
  }
}

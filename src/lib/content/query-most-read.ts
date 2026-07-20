import { unstable_cache } from "next/cache";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { toArticleCardDoc } from "./map-article";
import type { ArticleCardDoc } from "./types";

/** Default size for the homepage / sidebar "Most Read" module. */
const DEFAULT_MOST_READ_LIMIT = 5;

/**
 * Most Read runs on its own longer revalidate window (5 min) — view counts
 * bump constantly, but readers don't need the leaderboard refreshed on every
 * page hit, and this keeps homepage/article-detail render fast under load.
 */
const MOST_READ_REVALIDATE_SECONDS = 300;

async function fetchMostReadUncached(limit: number): Promise<ArticleCardDoc[]> {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "articles",
      where: { status: { equals: "published" } },
      // Neon returns rows with NULL viewCount last on `-viewCount` — that's the
      // desired behaviour: fresh publishes with 0 views sit at the bottom until
      // they actually accumulate reads.
      sort: "-viewCount",
      limit,
      depth: 1,
    });

    // Card-doc strip: drop the heavy Lexical body + precompute read-time so
    // this list never ships article bodies down the wire.
    return (result.docs as unknown as Array<ArticleCardDoc & { body?: unknown }>).map(
      toArticleCardDoc
    );
  } catch (err) {
    console.warn("[most-read] payload fetch failed, returning empty:", err);
    return [];
  }
}

const cachedMostReadByLimit = new Map<number, () => Promise<ArticleCardDoc[]>>();

function getCachedForLimit(limit: number) {
  const existing = cachedMostReadByLimit.get(limit);
  if (existing) return existing;
  const fn = unstable_cache(
    () => fetchMostReadUncached(limit),
    ["most-read-articles", String(limit)],
    { tags: ["articles"], revalidate: MOST_READ_REVALIDATE_SECONDS }
  );
  cachedMostReadByLimit.set(limit, fn);
  return fn;
}

/**
 * Published articles ranked by `viewCount` desc, capped at {@link limit}.
 * Cached via `unstable_cache` with tag `articles` (invalidated on any article
 * write) and a 5-minute revalidate window so the leaderboard stays fresh
 * without hammering the DB on every page render.
 *
 * Dev bypasses the cache for immediate feedback while iterating on content.
 */
export async function getMostReadArticles(
  limit: number = DEFAULT_MOST_READ_LIMIT
): Promise<ArticleCardDoc[]> {
  const safeLimit = Math.max(1, Math.min(20, Math.floor(limit)));
  if (process.env.NODE_ENV === "development") {
    return fetchMostReadUncached(safeLimit);
  }
  return getCachedForLimit(safeLimit)();
}

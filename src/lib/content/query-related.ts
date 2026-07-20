import type { Where } from "payload";
import { ARTICLE_LIST_SORT } from "@/constants";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { toArticleCardDoc } from "./map-article";
import type { ArticleCardDoc } from "./types";

/**
 * Related articles for an article-detail page.
 *
 * Ranking rules (evaluated once per request against a single candidate pool):
 *
 * 1. **Tag overlap wins** — candidates that share at least one tag with the
 *    source article are ranked first, scored by the number of shared tags.
 * 2. **Same category, newer wins** — candidates that share the primary
 *    category rank next, tie-broken by `publishedAt` desc.
 * 3. **Site-wide newest fills the rest** — if the pool still isn't full, the
 *    latest published articles are appended so the section is never empty.
 *
 * The function returns at most {@link limit} card docs and never includes the
 * source article itself. For published input articles it always returns
 * *something* (unless the site has literally one published article).
 *
 * Efficiency: one `payload.find({ or: [...] })` fetches every candidate
 * (tag-matched OR category-matched) in a single query with a generous cap; a
 * second bounded `find` covers the last-resort site-wide fallback only when
 * the pool comes up short.
 */
export type RelatedSourceArticle = {
  id: string | number;
  categories?: Array<{ id?: string | number; slug?: string } | string | null> | null;
  tags?: Array<{ id?: string | number; slug?: string } | string | null> | null;
};

const DEFAULT_RELATED_LIMIT = 3;
/** Candidate pool cap — enough to score well even for articles with many overlaps. */
const CANDIDATE_POOL_LIMIT = 40;

function extractId(
  ref: { id?: string | number } | string | null | undefined
): string | null {
  if (!ref) return null;
  if (typeof ref === "string") return ref;
  return ref.id != null ? String(ref.id) : null;
}

type CandidateDoc = ArticleCardDoc & {
  body?: unknown;
  categories?: Array<{ id?: string | number; slug?: string } | string> | null;
  tags?: Array<{ id?: string | number; slug?: string } | string> | null;
  publishedAt?: string | null;
};

function scoreCandidate(
  candidate: CandidateDoc,
  sourceTagIds: Set<string>,
  sourceCategoryIds: Set<string>
): number {
  let score = 0;
  for (const tag of candidate.tags ?? []) {
    const id = extractId(tag);
    if (id && sourceTagIds.has(id)) score += 10;
  }
  for (const cat of candidate.categories ?? []) {
    const id = extractId(cat);
    if (id && sourceCategoryIds.has(id)) score += 1;
  }
  return score;
}

export async function getRelatedArticles(
  article: RelatedSourceArticle,
  limit: number = DEFAULT_RELATED_LIMIT
): Promise<ArticleCardDoc[]> {
  const safeLimit = Math.max(1, Math.min(20, Math.floor(limit)));

  try {
    const payload = await getPayloadClient();

    const sourceId = String(article.id);
    const sourceTagIds = new Set(
      (article.tags ?? [])
        .map(extractId)
        .filter((id): id is string => Boolean(id))
    );
    const sourceCategoryIds = new Set(
      (article.categories ?? [])
        .map(extractId)
        .filter((id): id is string => Boolean(id))
    );

    // Build an OR of "in one of my tags" and "in one of my categories" so we
    // hit both signals in a single query. Payload's `in` operator accepts a
    // csv string of ids.
    const orConditions: Where[] = [];
    if (sourceTagIds.size > 0) {
      orConditions.push({
        tags: { in: Array.from(sourceTagIds).join(",") },
      });
    }
    if (sourceCategoryIds.size > 0) {
      orConditions.push({
        categories: { in: Array.from(sourceCategoryIds).join(",") },
      });
    }

    const picked: ArticleCardDoc[] = [];
    const seenIds = new Set<string>([sourceId]);

    if (orConditions.length > 0) {
      const pool = await payload.find({
        collection: "articles",
        where: {
          and: [
            { status: { equals: "published" } },
            { id: { not_equals: sourceId } },
            orConditions.length === 1 ? orConditions[0] : { or: orConditions },
          ],
        },
        // Newer first — used as a tie-break inside a score bucket, and it also
        // keeps the pool biased toward fresh material.
        sort: ARTICLE_LIST_SORT,
        limit: CANDIDATE_POOL_LIMIT,
        depth: 1,
      });

      const candidates = pool.docs as unknown as CandidateDoc[];

      // Rank: tag+category score desc, then publishedAt desc (stable sort).
      const scored = candidates
        .map((doc) => ({
          doc,
          score: scoreCandidate(doc, sourceTagIds, sourceCategoryIds),
          publishedAt: doc.publishedAt ? Date.parse(doc.publishedAt) : 0,
        }))
        .filter((row) => row.score > 0)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return b.publishedAt - a.publishedAt;
        });

      for (const row of scored) {
        if (picked.length >= safeLimit) break;
        const id = String(row.doc.id);
        if (seenIds.has(id)) continue;
        seenIds.add(id);
        picked.push(toArticleCardDoc(row.doc));
      }
    }

    // Last-resort fallback: pad with the latest site-wide published articles so
    // the "Read next" section is never empty for a published source article.
    if (picked.length < safeLimit) {
      const fallback = await payload.find({
        collection: "articles",
        where: {
          and: [
            { status: { equals: "published" } },
            { id: { not_equals: sourceId } },
          ],
        },
        sort: ARTICLE_LIST_SORT,
        // Ask for a little more than needed so we can skip any already-picked ids.
        limit: safeLimit + picked.length + 4,
        depth: 1,
      });

      for (const raw of fallback.docs as unknown as CandidateDoc[]) {
        if (picked.length >= safeLimit) break;
        const id = String(raw.id);
        if (seenIds.has(id)) continue;
        seenIds.add(id);
        picked.push(toArticleCardDoc(raw));
      }
    }

    return picked;
  } catch (err) {
    console.warn("[related] payload fetch failed, returning empty:", err);
    return [];
  }
}

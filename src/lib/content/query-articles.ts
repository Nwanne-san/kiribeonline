import { ARTICLE_LIST_SORT } from "@/constants";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { promoteDueScheduledArticlesIfIdle } from "@/services/cron.service";
import { buildArticleWhere } from "./article-filters";
import {
  buildSearchWhere,
  isSearchQueryValid,
  mergeWhereClauses,
} from "./article-search";
import { clampLimit, normalizePagination, parsePage } from "./pagination";
import { toArticleCardDoc } from "./map-article";
import type { ArticleCardDoc, ArticleListParams, ArticleListResult } from "./types";

export async function queryArticles(
  params: ArticleListParams = {}
): Promise<ArticleListResult<ArticleCardDoc>> {
  // Listings surface due scheduled articles via `buildArticleWhere`'s OR
  // clause, but the DB row stays `status: scheduled` until cron runs (up to
  // 24h on Hobby-plan cron). Kick a throttled promotion so the row flips and
  // subscribers get notified from the first bit of traffic, not the next
  // cron tick.
  promoteDueScheduledArticlesIfIdle();

  const payload = await getPayloadClient();
  const page = parsePage(params.page);
  const limit = clampLimit(params.limit);
  const sort = params.sort ?? ARTICLE_LIST_SORT;

  let categoryId = params.categoryId;
  if (categoryId === undefined && params.categorySlug) {
    const catResult = await payload.find({
      collection: "categories",
      where: { slug: { equals: params.categorySlug } },
      limit: 1,
      depth: 0,
    });
    if (!catResult.docs.length) {
      const pagination = normalizePagination(0, page, limit);
      return {
        docs: [],
        ...pagination,
      };
    }
    categoryId = catResult.docs[0].id;
  }

  let tagId = params.tagId;
  if (tagId === undefined && params.tagSlug) {
    const tagResult = await payload.find({
      collection: "tags",
      where: { slug: { equals: params.tagSlug } },
      limit: 1,
      depth: 0,
    });
    if (!tagResult.docs.length) {
      const pagination = normalizePagination(0, page, limit);
      return {
        docs: [],
        ...pagination,
      };
    }
    tagId = tagResult.docs[0].id;
  }

  let where = buildArticleWhere({
    categoryId,
    tagId,
  });

  if (params.q && isSearchQueryValid(params.q)) {
    where = mergeWhereClauses(where, buildSearchWhere(params.q));
  }

  const result = await payload.find({
    collection: "articles",
    where,
    page,
    limit,
    sort,
    depth: 1,
  });

  const pagination = normalizePagination(result.totalDocs, page, limit);

  return {
    // Strip the heavy Lexical body from every card and precompute reading time.
    docs: (result.docs as unknown as Array<ArticleCardDoc & { body?: unknown }>).map(
      toArticleCardDoc
    ),
    ...pagination,
  };
}

export async function queryArticleBySlug(slug: string) {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "articles",
    where: {
      and: [
        { slug: { equals: slug } },
        { status: { equals: "published" } },
      ],
    },
    limit: 1,
    depth: 2,
  });

  if (result.docs[0]) {
    return result.docs[0];
  }

  // If not yet published, check if it is a scheduled article whose time has passed
  const now = new Date().toISOString();
  const scheduledResult = await payload.find({
    collection: "articles",
    where: {
      and: [
        { slug: { equals: slug } },
        { status: { equals: "scheduled" } },
        { publishedAt: { less_than_equal: now } },
      ],
    },
    limit: 1,
    depth: 2,
  });

  const dueArticle = scheduledResult.docs[0];
  if (dueArticle) {
    try {
      await payload.update({
        collection: "articles",
        id: dueArticle.id,
        data: {
          status: "published",
          publishedAt: dueArticle.publishedAt ?? now,
        },
      });
      const { revalidateTag, revalidatePath } = await import("next/cache");
      revalidateTag("articles");
      revalidateTag("homepage");
      revalidatePath(`/articles/${slug}`);

      const { notifySubscribersOnArticlePublished } = await import(
        "@/server/modules/articles/subscriber-notification"
      );
      void notifySubscribersOnArticlePublished({
        articleId: dueArticle.id,
        articleTitle: (dueArticle.title as string) ?? "New article",
        articleSlug: (dueArticle.slug as string) ?? slug,
        articleExcerpt: (dueArticle.excerpt as string) ?? null,
      });
    } catch (err) {
      console.warn("[queryArticleBySlug] auto-promote scheduled article failed:", err);
    }
    return dueArticle;
  }

  return null;
}

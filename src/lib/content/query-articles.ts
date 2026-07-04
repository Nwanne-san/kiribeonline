import { ARTICLE_LIST_SORT } from "@/constants";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { buildArticleWhere } from "./article-filters";
import {
  buildSearchWhere,
  isSearchQueryValid,
  mergeWhereClauses,
} from "./article-search";
import { clampLimit, normalizePagination, parsePage } from "./pagination";
import type { ArticleCardDoc, ArticleListParams, ArticleListResult } from "./types";

export async function queryArticles(
  params: ArticleListParams = {}
): Promise<ArticleListResult<ArticleCardDoc>> {
  const payload = await getPayloadClient();
  const page = parsePage(params.page);
  const limit = clampLimit(params.limit);
  const sort = params.sort ?? ARTICLE_LIST_SORT;

  let where = buildArticleWhere({
    categorySlug: params.categorySlug,
    tagSlug: params.tagSlug,
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
    docs: result.docs as unknown as ArticleCardDoc[],
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

  return result.docs[0] ?? null;
}

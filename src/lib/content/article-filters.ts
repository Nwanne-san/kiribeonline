import type { Where } from "payload";
import type { ArticleFilterInput } from "./types";

export function buildArticleWhere(filters: ArticleFilterInput = {}): Where {
  const conditions: Where[] = [
    {
      status: {
        equals: filters.status ?? "published",
      },
    },
  ];

  if (filters.categoryId !== undefined && filters.categoryId !== null && filters.categoryId !== "") {
    conditions.push({
      categories: {
        equals: filters.categoryId,
      },
    });
  }

  if (filters.tagId !== undefined && filters.tagId !== null && filters.tagId !== "") {
    conditions.push({
      tags: {
        equals: filters.tagId,
      },
    });
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return { and: conditions };
}

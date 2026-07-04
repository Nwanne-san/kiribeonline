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

  if (filters.categorySlug) {
    conditions.push({
      "categories.slug": {
        equals: filters.categorySlug,
      },
    });
  }

  if (filters.tagSlug) {
    conditions.push({
      "tags.slug": {
        equals: filters.tagSlug,
      },
    });
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return { and: conditions };
}

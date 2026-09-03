import type { Where } from "payload";
import type { ArticleFilterInput } from "./types";

export function buildArticleWhere(filters: ArticleFilterInput = {}): Where {
  const targetStatus = filters.status ?? "published";
  const now = new Date().toISOString();

  const statusCondition: Where =
    targetStatus === "published"
      ? {
          or: [
            { status: { equals: "published" } },
            {
              and: [
                { status: { equals: "scheduled" } },
                { publishedAt: { less_than_equal: now } },
              ],
            },
          ],
        }
      : {
          status: {
            equals: targetStatus,
          },
        };

  const conditions: Where[] = [statusCondition];

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

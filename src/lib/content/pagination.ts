import {
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
} from "@/constants";

export function clampLimit(limit?: number | string): number {
  const numeric =
    typeof limit === "string" ? Number.parseInt(limit, 10) : limit;
  if (numeric === undefined || !Number.isFinite(numeric)) {
    return DEFAULT_PAGE_LIMIT;
  }
  const value = Math.floor(numeric);
  if (value < 1) return DEFAULT_PAGE_LIMIT;
  return Math.min(value, MAX_PAGE_LIMIT);
}

export function parsePage(page?: number | string | null): number {
  const parsed = typeof page === "string" ? Number.parseInt(page, 10) : page;
  if (!parsed || !Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

export function normalizePagination(
  totalDocs: number,
  page: number,
  limit: number
) {
  const totalPages = Math.max(1, Math.ceil(totalDocs / limit));
  const safePage = Math.min(page, totalPages);
  return {
    page: safePage,
    limit,
    totalDocs,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };
}

import { buildQuery } from "@/utils/helper";

export type ListQueryParams = {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  tag?: string;
  sort?: string;
};

/** Compose query string for app-owned list/search API routes. */
export function buildListQuery(params: ListQueryParams): string {
  return buildQuery({
    page: params.page,
    limit: params.limit,
    q: params.q,
    category: params.category,
    tag: params.tag,
    sort: params.sort,
  });
}

/** Stable cache key segment for filter objects. */
export function filterFingerprint(filters: Record<string, unknown>): string {
  const cleaned = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== null && value !== undefined && value !== "")
  );
  return JSON.stringify(cleaned);
}

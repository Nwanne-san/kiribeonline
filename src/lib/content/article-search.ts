import type { Where } from "payload";
import { MIN_SEARCH_LENGTH } from "@/constants";

export function isSearchQueryValid(q?: string): boolean {
  return Boolean(q && q.trim().length >= MIN_SEARCH_LENGTH);
}

export function buildSearchWhere(q: string): Where {
  const term = q.trim();
  return {
    or: [
      { title: { contains: term } },
      { excerpt: { contains: term } },
    ],
  };
}

export function mergeWhereClauses(base: Where, extra: Where): Where {
  return { and: [base, extra] };
}

"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
  URL_PARAMS,
} from "@/constants";

function clampLimit(value: number): number {
  if (!Number.isFinite(value) || value < 1) return DEFAULT_PAGE_LIMIT;
  return Math.min(Math.floor(value), MAX_PAGE_LIMIT);
}

function parsePage(value: string | null): number {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

export function usePagination(initialLimit = DEFAULT_PAGE_LIMIT) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = parsePage(searchParams.get(URL_PARAMS.page));
  const limit = clampLimit(Number.parseInt(searchParams.get(URL_PARAMS.limit) ?? String(initialLimit), 10));

  const replaceParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const setPage = useCallback(
    (nextPage: number) => {
      const safePage = nextPage >= 1 ? nextPage : 1;
      replaceParams({ [URL_PARAMS.page]: String(safePage) });
    },
    [replaceParams]
  );

  const setLimit = useCallback(
    (nextLimit: number) => {
      replaceParams({
        [URL_PARAMS.limit]: String(clampLimit(nextLimit)),
        [URL_PARAMS.page]: "1",
      });
    },
    [replaceParams]
  );

  const resetPage = useCallback(() => {
    replaceParams({ [URL_PARAMS.page]: "1" });
  }, [replaceParams]);

  return useMemo(
    () => ({ page, limit, setPage, setLimit, resetPage }),
    [page, limit, setPage, setLimit, resetPage]
  );
}

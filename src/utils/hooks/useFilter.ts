"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { URL_PARAMS } from "@/constants";

export type FilterState = {
  category?: string;
  tag?: string;
  status?: string;
};

function parseFilters(raw: string | null): FilterState {
  if (!raw) return {};
  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded) as FilterState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function useFilter(defaultFilters: FilterState = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filterRaw = searchParams.get(URL_PARAMS.filter);

  const filters = useMemo(() => {
    const parsed = parseFilters(filterRaw);
    if (!filterRaw && defaultFilters) {
      return { ...defaultFilters, ...parsed };
    }
    return parsed;
  }, [filterRaw, defaultFilters]);

  const setFilters = useCallback(
    (filterState: FilterState, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());
      const cleaned = Object.fromEntries(
        Object.entries(filterState).filter(([, value]) => value !== null && value !== undefined && value !== "")
      );

      if (Object.keys(cleaned).length) {
        params.set(URL_PARAMS.filter, encodeURIComponent(JSON.stringify(cleaned)));
      } else {
        params.delete(URL_PARAMS.filter);
      }

      if (resetPage) {
        params.set(URL_PARAMS.page, "1");
      }

      const query = params.toString();
      // scroll: false — filter controls live mid-page; keep the user's place.
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const clearFilters = useCallback(
    (keys?: string[]) => {
      if (keys?.length) {
        const next = { ...filters };
        keys.forEach((key) => delete next[key as keyof FilterState]);
        setFilters(next);
        return;
      }
      setFilters({});
    },
    [filters, setFilters]
  );

  const applyFilters = useCallback(
    (partial: FilterState) => {
      const merged: FilterState = { ...filters, ...partial };
      Object.keys(merged).forEach((key) => {
        const value = merged[key as keyof FilterState];
        if (typeof value === "string" && !value.length) {
          delete merged[key as keyof FilterState];
        }
      });
      setFilters(merged);
    },
    [filters, setFilters]
  );

  const setFilter = useCallback(
    (key: keyof FilterState, value: string | undefined) => {
      applyFilters({ [key]: value });
    },
    [applyFilters]
  );

  return { filters, applyFilters, clearFilters, setFilter };
}

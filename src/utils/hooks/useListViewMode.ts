"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_LIST_VIEW,
  LIST_VIEW_MODES,
  type ListViewMode,
  URL_PARAMS,
} from "@/constants";

function parseViewMode(value: string | null): ListViewMode {
  if (value && LIST_VIEW_MODES.includes(value as ListViewMode)) {
    return value as ListViewMode;
  }
  return DEFAULT_LIST_VIEW;
}

export function useListViewMode() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const view = parseViewMode(searchParams.get(URL_PARAMS.view));

  const setView = useCallback(
    (nextView: ListViewMode) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(URL_PARAMS.view, nextView);
      params.set(URL_PARAMS.page, "1");
      // scroll: false — the toggle sits above the list; jumping to the top of
      // the page on every view switch loses the reader's place.
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return { view, setView, isFeed: view === "feed" };
}

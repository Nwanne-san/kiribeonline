"use client";

import { useMemo } from "react";
import { ApiMethods } from "../../../../types/service";
import {
  ARTICLE_LIST_SORT,
  LIST_STALE_TIME_MS,
  MIN_SEARCH_LENGTH,
  SEARCH_STALE_TIME_MS,
} from "@/constants";
import type { ArticleCardDoc, ArticleListResult } from "@/lib/content/types";
import { mergeInfinitePages } from "@/lib/content/merge-pages";
import { filterFingerprint } from "@/lib/url/build-list-query";
import { editorialQueryKeys } from "@/modules/editorial/constants/query-keys";
import {
  useDebouncedUrlParam,
  useFilter,
  useInfiniteQueryService,
  useListViewMode,
  usePagination,
  useQueryService,
} from "@/utils/hooks";

export type UseArticlesListOptions = {
  mode?: "archive" | "search";
  defaultCategorySlug?: string;
  defaultTagSlug?: string;
};

export function useArticlesList(options: UseArticlesListOptions = {}) {
  const { mode = "archive", defaultCategorySlug, defaultTagSlug } = options;

  const { page, limit, setPage, setLimit } = usePagination();
  const { filters } = useFilter({
    category: defaultCategorySlug,
    tag: defaultTagSlug,
  });
  const { value: searchValue, debouncedValue: q, setValue: setSearchValue } =
    useDebouncedUrlParam();
  const { view } = useListViewMode();

  const categorySlug = filters.category ?? defaultCategorySlug;
  const tagSlug = filters.tag ?? defaultTagSlug;
  const filterKey = filterFingerprint({ category: categorySlug, tag: tagSlug });

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      category: categorySlug,
      tag: tagSlug,
      q: q.trim() || undefined,
      sort: ARTICLE_LIST_SORT,
    }),
    [page, limit, categorySlug, tagSlug, q]
  );

  const isSearchMode = mode === "search";
  const searchEnabled = isSearchMode ? q.trim().length >= MIN_SEARCH_LENGTH : true;
  const apiPath = isSearchMode ? "/api/search" : "/api/articles";

  const paginatedQuery = useQueryService<
    Record<string, string | number | undefined>,
    ArticleListResult<ArticleCardDoc>
  >({
    service: {
      path: apiPath,
      method: ApiMethods.GET,
      data: isSearchMode
        ? { q: q.trim(), page, limit, sort: ARTICLE_LIST_SORT }
        : queryParams,
    },
    options: {
      keys: [editorialQueryKeys.articlesList, mode],
      enabled: searchEnabled && view !== "feed",
      staleTime: isSearchMode ? SEARCH_STALE_TIME_MS : LIST_STALE_TIME_MS,
      keepPreviousData: true,
      filterFingerprint: filterKey,
      searchQuery: q,
    },
  });

  const infiniteQuery = useInfiniteQueryService<
    Record<string, string | number | undefined>,
    ArticleListResult<ArticleCardDoc>
  >({
    service: {
      path: apiPath,
      method: ApiMethods.GET,
      data: isSearchMode
        ? { q: q.trim(), limit, sort: ARTICLE_LIST_SORT }
        : {
            limit,
            category: categorySlug,
            tag: tagSlug,
            q: q.trim() || undefined,
            sort: ARTICLE_LIST_SORT,
          },
    },
    options: {
      keys: [editorialQueryKeys.articlesList, mode, "infinite"],
      enabled: searchEnabled && view === "feed",
      staleTime: LIST_STALE_TIME_MS,
      filterFingerprint: filterKey,
      searchQuery: q,
    },
  });

  const isFeed = view === "feed";
  const activeQuery = isFeed ? infiniteQuery : paginatedQuery;

  const articles = isFeed
    ? mergeInfinitePages(infiniteQuery.data?.pages)
    : (paginatedQuery.data?.docs ?? []);

  const pagination = isFeed
    ? {
        page: infiniteQuery.data?.pages.at(-1)?.page ?? 1,
        limit,
        totalDocs: infiniteQuery.data?.pages.at(-1)?.totalDocs ?? 0,
        totalPages: infiniteQuery.data?.pages.at(-1)?.totalPages ?? 1,
        hasNextPage: infiniteQuery.hasNextPage ?? false,
        hasPrevPage: false,
      }
    : {
        page: paginatedQuery.data?.page ?? page,
        limit: paginatedQuery.data?.limit ?? limit,
        totalDocs: paginatedQuery.data?.totalDocs ?? 0,
        totalPages: paginatedQuery.data?.totalPages ?? 1,
        hasNextPage: paginatedQuery.data?.hasNextPage ?? false,
        hasPrevPage: paginatedQuery.data?.hasPrevPage ?? false,
      };

  return {
    articles,
    view,
    searchValue,
    setSearchValue,
    q,
    filters,
    pagination,
    page,
    limit,
    setPage,
    setLimit,
    isLoading: activeQuery.isLoading,
    isError: activeQuery.isError,
    isFetching: activeQuery.isFetching,
    refetch: activeQuery.refetch,
    fetchNextPage: infiniteQuery.fetchNextPage,
    hasNextPage: infiniteQuery.hasNextPage,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    searchEnabled,
    isSearchMode,
  };
}

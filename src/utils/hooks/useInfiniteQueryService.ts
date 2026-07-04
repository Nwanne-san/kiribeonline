"use client";

import {
  type InfiniteData,
  type QueryKey,
  useInfiniteQuery,
} from "@tanstack/react-query";
import client from "@/utils/client";
import { unwrapApiData } from "@/lib/api/unwrap";
import { QUERY_RETRY_COUNT } from "@/constants";
import { ApiMethods } from "../../../types/service";
import type { ArticleListResult } from "@/lib/content/types";

export type InfinitePageParam = {
  page: number;
  limit: number;
};

export interface UseInfiniteQueryServiceProps<Req extends object> {
  service: {
    path: string;
    method?: ApiMethods;
    headers?: Record<string, string>;
    data?: Req;
  };
  options?: {
    keys?: string[];
    enabled?: boolean;
    staleTime?: number;
    filterFingerprint?: string;
    searchQuery?: string;
  };
}

export function useInfiniteQueryService<
  Req extends object,
  Resp extends ArticleListResult<unknown>,
>(props: UseInfiniteQueryServiceProps<Req>) {
  const { service, options } = props;
  const {
    keys = [],
    enabled = true,
    staleTime,
    filterFingerprint: filterKey = "",
    searchQuery = "",
  } = options ?? {};

  const payload = (service.data ?? {}) as Req & InfinitePageParam;
  const limit = payload.limit ?? 24;
  const initialPageParam: InfinitePageParam = { page: 1, limit };

  return useInfiniteQuery<
    Resp,
    ErrorResponse,
    InfiniteData<Resp, InfinitePageParam>,
    QueryKey,
    InfinitePageParam
  >({
    queryKey: [
      ...keys,
      service.path,
      service.data,
      filterKey,
      searchQuery,
    ],
    enabled,
    staleTime,
    retry: QUERY_RETRY_COUNT,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    initialPageParam,
    queryFn: async ({ pageParam }) => {
      const result = await client.request<Req & InfinitePageParam, Resp>({
        path: service.path,
        method: service.method ?? ApiMethods.GET,
        data: { ...payload, ...pageParam } as Req & InfinitePageParam,
        headers: service.headers,
      });
      return unwrapApiData(result as Resp);
    },
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      if (!lastPage.hasNextPage) return undefined;
      return {
        page: (lastPage.page ?? lastPageParam.page) + 1,
        limit: lastPage.limit ?? lastPageParam.limit,
      };
    },
  });
}

"use client";

import { keepPreviousData, type QueryKey, useQuery } from "@tanstack/react-query";
import client from "@/utils/client";
import { unwrapApiData } from "@/lib/api/unwrap";
import { QUERY_RETRY_COUNT } from "@/constants";
import { ApiMethods } from "../../../types/service";

export interface UseQueryServiceProps<Req extends object> {
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
    refetchOnWindowFocus?: boolean;
    keepPreviousData?: boolean;
    filterFingerprint?: string;
    searchQuery?: string;
  };
}

export function useQueryService<Req extends object, Resp extends object>(
  props: UseQueryServiceProps<Req>
) {
  const { service, options } = props;
  const {
    keys = [],
    enabled = true,
    staleTime,
    refetchOnWindowFocus,
    keepPreviousData: useKeepPreviousData = false,
    filterFingerprint: filterKey = "",
    searchQuery = "",
  } = options ?? {};

  return useQuery<Resp, ErrorResponse, Resp, QueryKey>({
    queryKey: [
      ...keys,
      service.path,
      service.data,
      filterKey,
      searchQuery,
    ],
    enabled,
    staleTime,
    refetchOnWindowFocus: refetchOnWindowFocus ?? false,
    retry: QUERY_RETRY_COUNT,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    placeholderData: useKeepPreviousData ? keepPreviousData : undefined,
    queryFn: async () => {
      const result = await client.request<Req, Resp>({
        path: service.path,
        method: service.method ?? ApiMethods.GET,
        data: service.data,
        headers: service.headers,
      });

      return unwrapApiData(result as Resp);
    },
  });
}

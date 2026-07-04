import { UseMutationOptions } from "@tanstack/react-query";
import { ApiMethods } from "../../../types/service";

declare global {
  interface PaginationData {
    count?: number;
    page?: number;
    limit?: number;
    search?: string;
  }

  type PageParams = Omit<PaginationData, "count">;

  interface UseInfiniteQueryServiceProps<Req extends object> {
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

  interface UseMutationServiceProps<Req, _Resp> {
    service: ServiceInterface<Req, _Resp>;
    requestPayload?: Req;
    options?: Omit<
      UseMutationOptions<_Resp, Error, Req>,
      "mutationKey" | "mutationFn"
    > & {
      keys?: string[];
      enabled?: boolean;
      onError?: (err: ErrorResponse) => void;
    };
  }

  interface UseQueryServiceProps<Req extends object> {
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
}

export {};

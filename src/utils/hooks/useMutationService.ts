"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import client from "@/utils/client";
import { ApiMethods } from "../../../types/service";
import { useKiribeToast } from "@/modules/shared/components/feedback/KiribeSnackbar";

type ServiceConfig<Req> =
  | {
      path: string;
      method?: ApiMethods;
      headers?: Record<string, string>;
    }
  | ((variables: Req) => {
      path: string;
      method?: ApiMethods;
      headers?: Record<string, string>;
      data?: Req;
    });

export interface KiribeMutationOptions<Resp, Req> {
  keys?: string[];
  onSuccess?: (
    response: Resp,
    helpers: {
      queryClient: ReturnType<typeof useQueryClient>;
      router: ReturnType<typeof useRouter>;
      variables: Req;
    }
  ) => void;
  onError?: (error: ErrorResponse) => void;
  successTitle?: string | ((response: Resp) => string);
  successMessage?: string | ((response: Resp) => string);
  errorTitle?: string;
  invalidateKeys?: string[];
  redirectTo?: string;
}

export interface UseMutationServiceProps<Req extends object, Resp = unknown> {
  service: ServiceConfig<Req>;
  options?: KiribeMutationOptions<Resp, Req>;
}

export function useMutationService<Req extends object, Resp = unknown>(
  props: UseMutationServiceProps<Req, Resp>
) {
  const { options = {} } = props;
  const {
    keys = [],
    onSuccess,
    onError,
    successTitle,
    successMessage,
    errorTitle,
    invalidateKeys,
    redirectTo,
  } = options;

  const { showToast } = useKiribeToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<Resp, ErrorResponse, Req>({
    mutationKey: [...keys, props.service],
    mutationFn: async (data) => {
      const resolved =
        typeof props.service === "function" ? props.service(data) : props.service;

      const { data: requestBody, ...serviceConfig } = resolved as typeof resolved & {
        data?: Req;
      };

      return client.request<Req, Resp>({
        ...serviceConfig,
        path: resolved.path,
        method: resolved.method ?? ApiMethods.POST,
        data: requestBody !== undefined ? requestBody : data,
      });
    },
    onSuccess: async (response, variables) => {
      if (onSuccess) {
        onSuccess(response, { queryClient, router, variables });
      }

      if (invalidateKeys?.length) {
        invalidateKeys.forEach((key) =>
          queryClient.invalidateQueries({ queryKey: [key] })
        );
      }

      const title =
        typeof successTitle === "function" ? successTitle(response) : successTitle;
      const description =
        typeof successMessage === "function"
          ? successMessage(response)
          : successMessage ?? (response as { message?: string })?.message;

      if (title || description) {
        showToast({
          message: title ?? "Success",
          description: description ?? "Your request was submitted.",
          severity: "success",
        });
      }

      if (redirectTo) {
        router.replace(redirectTo);
      }
    },
    onError: (error) => {
      if (onError) {
        onError(error);
        return;
      }

      const errorMessage =
        error?.message ??
        (error?.errors
          ? Object.values(error.errors).flat().join(", ")
          : "Something went wrong.");

      showToast({
        message: errorTitle ?? "Request failed",
        description: errorMessage,
        severity: "error",
      });
    },
  });
}

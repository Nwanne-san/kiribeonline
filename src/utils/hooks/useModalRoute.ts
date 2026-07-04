"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { URL_PARAMS } from "@/constants";

export type ModalRouteValue = "image" | string;

export function useModalRoute() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const modal = searchParams.get(URL_PARAMS.modal);

  const openModal = useCallback(
    (route: ModalRouteValue, otherParams?: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(URL_PARAMS.modal, route);
      if (otherParams) {
        Object.entries(otherParams).forEach(([key, value]) => {
          params.set(key, value);
        });
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const closeModal = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(URL_PARAMS.modal);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [pathname, router, searchParams]);

  const navigateBack = useCallback(() => {
    if (modal) {
      closeModal();
    } else {
      router.back();
    }
  }, [closeModal, modal, router]);

  return { modal, openModal, closeModal, navigateBack };
}

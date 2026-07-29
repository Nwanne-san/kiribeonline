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
      // scroll: false — opening a modal must not move the page underneath it.
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  /**
   * `alsoClear` removes the modal's own params too (e.g. `reel`, `image`), so
   * closing doesn't leave a stale id in the URL that would reopen on refresh.
   */
  const closeModal = useCallback(
    (alsoClear?: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(URL_PARAMS.modal);
      alsoClear?.forEach((key) => params.delete(key));
      const query = params.toString();
      // scroll: false — closing a modal returns to the page exactly as it was.
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const navigateBack = useCallback(() => {
    if (modal) {
      closeModal();
    } else {
      router.back();
    }
  }, [closeModal, modal, router]);

  return { modal, openModal, closeModal, navigateBack };
}

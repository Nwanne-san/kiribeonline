"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_DEBOUNCE_MS, URL_PARAMS } from "@/constants";

type UseDebouncedUrlParamOptions = {
  param?: string;
  debounceMs?: number;
  resetPageOnChange?: boolean;
};

export function useDebouncedUrlParam(options: UseDebouncedUrlParamOptions = {}) {
  const {
    param = URL_PARAMS.q,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    resetPageOnChange = true,
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlValue = searchParams.get(param) ?? "";

  const [localValue, setLocalValue] = useState(urlValue);

  useEffect(() => {
    setLocalValue(urlValue);
  }, [urlValue]);

  useEffect(() => {
    const handler = window.setTimeout(() => {
      if (localValue === urlValue) return;

      const params = new URLSearchParams(searchParams.toString());
      if (localValue.trim()) {
        params.set(param, localValue.trim());
      } else {
        params.delete(param);
      }
      if (resetPageOnChange) {
        params.set(URL_PARAMS.page, "1");
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }, debounceMs);

    return () => window.clearTimeout(handler);
  }, [localValue, urlValue, debounceMs, param, pathname, resetPageOnChange, router, searchParams]);

  const setValue = useCallback((value: string) => {
    setLocalValue(value);
  }, []);

  return {
    value: localValue,
    debouncedValue: urlValue,
    setValue,
  };
}

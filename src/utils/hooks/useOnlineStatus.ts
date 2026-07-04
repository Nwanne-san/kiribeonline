"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the browser's connectivity.
 *
 * SSR-safe: defaults to `true` (assume online) so server render and first
 * client paint agree, then reconciles from `navigator.onLine` on mount and
 * stays in sync via the `online` / `offline` window events.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof navigator !== "undefined" && "onLine" in navigator) {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

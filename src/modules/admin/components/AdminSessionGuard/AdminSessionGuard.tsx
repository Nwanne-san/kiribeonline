"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { AdminRoutes } from "@/routes/admin.routes";
import { sessionEventEmitter } from "@/utils/eventEmitters";
import { setPendingToast } from "@/modules/shared/components/feedback/KiribeSnackbar";
import {
  ADMIN_SESSION_TTL_MS,
  clearAdminSessionExpiry,
  getAdminSessionExpiresAt,
  isAdminSessionExpired,
  setAdminSessionExpiry,
} from "@/modules/admin/lib/session";

/**
 * Guard mounted on every authenticated admin route.
 *
 * Enforces:
 * 1. 2-hour max session lifespan: force-logs out after 2 hours with a warning toast.
 * 2. Unauthorized (401) interception: when a session expires mid-use or fails
 *    an auth check (e.g. user returns to an idle tab hours later and tries to make
 *    changes), forcefully clears the session via POST /api/admin/auth/logout, displays
 *    a session-expired toast, and redirects to /admin/login with ?next=.
 */
export function AdminSessionGuard() {
  const pathname = usePathname();
  const redirecting = useRef(false);

  useEffect(() => {
    if (pathname === AdminRoutes.login) return;

    // If an authenticated admin arrives without a tracked expiration,
    // establish their 2-hour session clock now.
    if (getAdminSessionExpiresAt() === null) {
      setAdminSessionExpiry(ADMIN_SESSION_TTL_MS);
    }

    const forceLogout = async (title: string, description: string) => {
      if (redirecting.current) return;
      if (pathname === AdminRoutes.login) return;
      redirecting.current = true;

      try {
        await fetch("/api/admin/auth/logout", { method: "POST" });
      } catch {
        // Continue even if network is degraded
      }

      clearAdminSessionExpiry();
      setPendingToast({
        message: title,
        description,
        severity: "warning",
        duration: 7000,
      });

      const current =
        typeof window === "undefined"
          ? pathname || AdminRoutes.home
          : `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const next = encodeURIComponent(current);
      window.location.assign(`${AdminRoutes.login}?next=${next}`);
    };

    // Check immediate expiration on mount
    if (isAdminSessionExpired()) {
      void forceLogout(
        "Session expired",
        "You have been logged out after 2 hours. Please sign in again."
      );
      return;
    }

    // Schedule timer for remaining time until 2 hours
    const expiresAt = getAdminSessionExpiresAt() ?? Date.now() + ADMIN_SESSION_TTL_MS;
    const remainingMs = Math.max(0, expiresAt - Date.now());

    const timer = setTimeout(() => {
      void forceLogout(
        "Session expired",
        "You have been logged out after 2 hours. Please sign in again."
      );
    }, remainingMs);

    // Periodic check (every 15s) and visibility/focus handlers for when tab was idle/background/asleep
    const checkExpiration = () => {
      if (isAdminSessionExpired()) {
        void forceLogout(
          "Session expired",
          "You have been logged out after 2 hours. Please sign in again."
        );
      }
    };

    const interval = setInterval(checkExpiration, 15_000);
    window.addEventListener("focus", checkExpiration);
    document.addEventListener("visibilitychange", checkExpiration);

    // Listen for 401 Unauthorized emitted by client.ts
    const handleUnauthorized = () => {
      void forceLogout(
        "Session expired",
        "Your session has expired. Please sign in again."
      );
    };

    sessionEventEmitter.on("unauthorized", handleUnauthorized);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("focus", checkExpiration);
      document.removeEventListener("visibilitychange", checkExpiration);
      sessionEventEmitter.off("unauthorized", handleUnauthorized);
    };
  }, [pathname]);

  return null;
}

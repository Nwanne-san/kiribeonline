"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { AdminRoutes } from "@/routes/admin.routes";
import { sessionEventEmitter } from "@/utils/eventEmitters";

/**
 * Listens for the "unauthorized" event that `src/utils/client.ts` emits on any
 * 401 response, and redirects the admin to the login page with `?next=` set to
 * the current URL. Before this listener existed nothing subscribed to the
 * emitter, so a session that expired mid-use produced silently failing queries
 * with no redirect (AUTH-HARDENING §8b).
 *
 * Mounted from `(shell)/layout.tsx` so it exists on every authenticated route
 * and only there — the public site's 401s (subscribe, contact) are read-only
 * and should not bounce visitors to /admin/login.
 */
export function AdminSessionGuard() {
  const router = useRouter();
  const pathname = usePathname();

  // Ref, not state — a burst of failed requests can fire the event many times
  // in quick succession, and we only want to trigger the redirect once.
  const redirecting = useRef(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      if (redirecting.current) return;
      // Never bounce off the login itself (would produce ?next=/admin/login).
      if (pathname === AdminRoutes.login) return;
      redirecting.current = true;
      // Preserve search + hash so an editor's filter/tab state survives the
      // round-trip through login. `pathname` alone would drop `?filter=drafts`
      // and land them on a bare list after re-auth.
      const current =
        typeof window === "undefined"
          ? pathname || AdminRoutes.home
          : `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const next = encodeURIComponent(current);
      router.replace(`${AdminRoutes.login}?next=${next}`);
    };
    sessionEventEmitter.on("unauthorized", handleUnauthorized);
    return () => {
      sessionEventEmitter.off("unauthorized", handleUnauthorized);
    };
  }, [pathname, router]);

  return null;
}

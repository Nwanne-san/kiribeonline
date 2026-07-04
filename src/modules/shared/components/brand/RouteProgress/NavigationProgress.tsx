"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

type NavigationProgressValue = {
  /** True while a route transition is in flight. */
  pending: boolean;
  /** Manually mark a transition as started (for programmatic router.push). */
  start: () => void;
};

const NavigationProgressContext = createContext<NavigationProgressValue>({
  pending: false,
  start: () => {},
});

/**
 * Completion watcher. Reads the live URL and clears pending whenever it changes.
 * Isolated in its own component + Suspense so `useSearchParams` does not opt the
 * whole subtree out of static rendering.
 */
function NavigationCompletionWatcher({ onSettle }: { onSettle: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    onSettle();
  }, [pathname, searchParams, onSettle]);

  return null;
}

export function NavigationProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pending, setPending] = useState(false);

  const settle = useCallback(() => setPending(false), []);
  const start = useCallback(() => setPending(true), []);

  // Capture same-origin link navigations anywhere in the subtree.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      const target = anchor.getAttribute("target");
      if (!href || (target && target !== "_self") || anchor.hasAttribute("download")) {
        return;
      }
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Same page or pure hash change — no transition.
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }
      setPending(true);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Safety net: never let the indicator hang if a navigation is cancelled.
  useEffect(() => {
    if (!pending) return;
    const timeout = window.setTimeout(() => setPending(false), 8000);
    return () => window.clearTimeout(timeout);
  }, [pending]);

  const value = useMemo(() => ({ pending, start }), [pending, start]);

  return (
    <NavigationProgressContext.Provider value={value}>
      <Suspense fallback={null}>
        <NavigationCompletionWatcher onSettle={settle} />
      </Suspense>
      {children}
    </NavigationProgressContext.Provider>
  );
}

export function useNavigationProgress(): NavigationProgressValue {
  return useContext(NavigationProgressContext);
}

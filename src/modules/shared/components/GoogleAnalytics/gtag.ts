type GtagFn = (...args: unknown[]) => void;

/**
 * Fire a GA4 event. No-ops on the server and when gtag has not loaded (e.g. no
 * measurement id configured, or an ad-blocker stripped the script), so call
 * sites never need to guard.
 */
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
  if (typeof gtag !== "function") return;
  gtag("event", name, params ?? {});
}

/** Send a GA4 page_view for a client-side navigation. */
export function trackPageView(url: string): void {
  trackEvent("page_view", { page_path: url, page_location: url });
}

"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ArticleListView } from "@/modules/editorial/components";
import { DEFAULT_DEBOUNCE_MS, MIN_SEARCH_LENGTH, URL_PARAMS } from "@/constants";
import { trackEvent } from "@/modules/shared/components/GoogleAnalytics";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const q = (searchParams.get(URL_PARAMS.q) ?? "").trim();

  // Track a GA4 `search` event once `q` has settled for the debounce window.
  // Deduped against the last-fired term so React re-renders and URL sort/page
  // updates that keep `q` unchanged don't double-count. Complements the
  // header's Enter-submit event and captures deep-links, shared URLs, and
  // in-page query edits.
  const lastTrackedRef = useRef<string | null>(null);
  useEffect(() => {
    if (q.length < MIN_SEARCH_LENGTH) return;
    if (lastTrackedRef.current === q) return;
    const handle = window.setTimeout(() => {
      trackEvent("search", { search_term: q });
      lastTrackedRef.current = q;
    }, DEFAULT_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [q]);

  return (
    <ArticleListView
      mode="search"
      sectionTitle={q ? `Results for "${q}"` : "Search"}
      hero={{
        kicker: "Kiribé Search",
        title: q ? `Results for "${q}"` : "Search the archive",
        description: q
          ? undefined
          : "Search Kiribé Online by title, topic, or author.",
      }}
    />
  );
}

export function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}

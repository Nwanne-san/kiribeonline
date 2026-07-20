"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ArticleListView } from "@/modules/editorial/components";
import { DEFAULT_DEBOUNCE_MS, MIN_SEARCH_LENGTH, URL_PARAMS } from "@/constants";
import { trackEvent } from "@/modules/shared/components/GoogleAnalytics";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const q = (searchParams.get(URL_PARAMS.q) ?? "").trim();

  // Fire the GA4 `search` event once the URL `q` settles — never per
  // keystroke and never twice for the same value in a row. Using the shared
  // debounce constant keeps the cadence in line with the debounced search
  // fetch itself, and remembering the last tracked value prevents a re-fire
  // when React re-renders with an unchanged q (Suspense boundaries, focus
  // returns, etc.).
  const lastTrackedRef = useRef<string | null>(null);
  useEffect(() => {
    if (q.length < MIN_SEARCH_LENGTH) return;
    if (lastTrackedRef.current === q) return;
    const handle = setTimeout(() => {
      trackEvent("search", { search_term: q });
      lastTrackedRef.current = q;
    }, DEFAULT_DEBOUNCE_MS);
    return () => clearTimeout(handle);
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

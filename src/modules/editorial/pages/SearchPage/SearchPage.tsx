"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArticleListView } from "@/modules/editorial/components";
import { URL_PARAMS } from "@/constants";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const q = (searchParams.get(URL_PARAMS.q) ?? "").trim();

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

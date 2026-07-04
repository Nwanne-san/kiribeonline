"use client";

import { Suspense } from "react";
import { ArticleListView } from "@/modules/editorial/components";

function ArticlesPageContent() {
  return (
    <ArticleListView
      mode="archive"
      hero={{
        kicker: "Kiribé Editorial Archive",
        title: "All Articles",
        description:
          "Browse the full archive across Film, TV, Opinion, News, Spotlight and more.",
      }}
    />
  );
}

export function ArticlesPage() {
  return (
    <Suspense fallback={null}>
      <ArticlesPageContent />
    </Suspense>
  );
}

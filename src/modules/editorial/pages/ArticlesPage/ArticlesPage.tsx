"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArticleListView } from "@/modules/editorial/components";
import { PublicRoutes } from "@/routes/public.routes";

/** "tv-reviews" → "Tv Reviews" for the "filtered by" chip label. */
function humanizeSlug(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function ArticlesPageContent() {
  const searchParams = useSearchParams();
  const tag = searchParams.get("tag") ?? undefined;
  const category = searchParams.get("category") ?? undefined;

  const activeFilter = tag
    ? { label: humanizeSlug(tag), clearHref: PublicRoutes.articles }
    : category
      ? { label: humanizeSlug(category), clearHref: PublicRoutes.articles }
      : undefined;

  return (
    <ArticleListView
      mode="archive"
      defaultTagSlug={tag}
      defaultCategorySlug={category}
      activeFilter={activeFilter}
      sectionTitle="All Articles"
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

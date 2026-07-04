"use client";

import { Suspense } from "react";
import { ArticleListView } from "@/modules/editorial/components";

type CategoryArchivePageProps = {
  slug: string;
  title?: string;
};

function CategoryArchivePageContent({ slug, title }: CategoryArchivePageProps) {
  const displayTitle = title ?? slug.replace(/-/g, " ");

  return (
    <ArticleListView
      mode="archive"
      defaultCategorySlug={slug}
      hero={{
        kicker: "Category",
        title: displayTitle,
        description: `Articles in ${displayTitle}.`,
      }}
      emptyTitle="No articles in this category"
      emptyDescription="Check back later or browse all articles."
    />
  );
}

export function CategoryArchivePage(props: CategoryArchivePageProps) {
  return (
    <Suspense fallback={null}>
      <CategoryArchivePageContent {...props} />
    </Suspense>
  );
}

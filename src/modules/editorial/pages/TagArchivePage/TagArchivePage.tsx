"use client";

import { Suspense } from "react";
import { ArticleListView } from "@/modules/editorial/components";

type TagArchivePageProps = {
  slug: string;
  title?: string;
};

function TagArchivePageContent({ slug, title }: TagArchivePageProps) {
  const displayTitle = title ?? slug.replace(/-/g, " ");

  return (
    <ArticleListView
      mode="archive"
      defaultTagSlug={slug}
      hero={{
        kicker: "Tag",
        title: displayTitle,
        description: `Articles tagged ${displayTitle}.`,
      }}
      emptyTitle="No articles with this tag"
      emptyDescription="Check back later or browse all articles."
    />
  );
}

export function TagArchivePage(props: TagArchivePageProps) {
  return (
    <Suspense fallback={null}>
      <TagArchivePageContent {...props} />
    </Suspense>
  );
}

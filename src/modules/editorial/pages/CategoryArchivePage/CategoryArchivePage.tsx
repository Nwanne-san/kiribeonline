"use client";

import { Suspense } from "react";
import { ArticleListView } from "@/modules/editorial/components";
import { CATEGORY_COLORS } from "@/theme/category-colors";

type CategoryArchivePageProps = {
  slug: string;
  title?: string;
  description?: string;
};

/** Hero blurbs per section — Figma V5 category headers. */
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  film: "Deep criticism, interviews, and analysis of cinema from Africa and around the world.",
  tv: "Serialized storytelling, reviews, and industry analysis from the new golden age of television.",
  videos: "Original video features, interviews, and visual storytelling from the Kiribé desk.",
  news: "The latest headlines and reporting from across film, television, and culture.",
  opinion: "Bold criticism, cultural commentary, and essays that challenge conventional wisdom.",
  spotlight: "In-depth profiles of the directors, actors, and creatives defining contemporary culture.",
};

function CategoryArchivePageContent({ slug, title, description }: CategoryArchivePageProps) {
  const displayTitle = title ?? slug.replace(/-/g, " ");
  const accentColor = CATEGORY_COLORS[slug as keyof typeof CATEGORY_COLORS]?.bg;
  const heroDescription =
    description ??
    CATEGORY_DESCRIPTIONS[slug] ??
    `Stories, reviews, and reporting from Kiribé's ${displayTitle} desk.`;

  return (
    <ArticleListView
      mode="archive"
      defaultCategorySlug={slug}
      featured
      sectionTitle={`All ${displayTitle} Articles`}
      hero={{
        title: displayTitle,
        accentColor,
        accentLabel: displayTitle,
        description: heroDescription,
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

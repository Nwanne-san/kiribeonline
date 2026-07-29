"use client";

import Box from "@mui/material/Box";
import type { ArticleCardDoc } from "@/lib/content/types";
import { ArticleCard } from "@/modules/editorial/components/ArticleCard";
import { KiribeTypography } from "@/modules/shared/components/ui";

type ReadNextSectionProps = {
  articles: ArticleCardDoc[];
  /** Section heading override. Defaults to "Read next". */
  title?: string;
};

/**
 * "Read next" — three ArticleCards below the article body / after the related
 * rail. Renders nothing when the list is empty so the section doesn't dangle
 * on cold sites, but the discovery pipeline (tag overlap → same-category →
 * site-wide newest) means published articles should always have something to
 * show.
 */
export function ReadNextSection({ articles, title = "Read next" }: ReadNextSectionProps) {
  if (!articles.length) return null;

  return (
    <Box
      component="section"
      aria-labelledby="read-next-heading"
      className="bg-surface py-12 md:py-16"
    >
      <Box className="editorial-container">
        <KiribeTypography
          id="read-next-heading"
          className="font-headline font-normal text-2xl tracking-wide uppercase text-burgundy"
        >
          {title}
        </KiribeTypography>
        <Box className="mt-2 mb-8 w-12 h-0.5 bg-mustard" />
        <Box className="grid gap-8 grid-cols-1 md:grid-cols-2 base:grid-cols-3">
          {articles.slice(0, 3).map((article) => (
            <ArticleCard key={article.id} article={article} variant="grid" />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

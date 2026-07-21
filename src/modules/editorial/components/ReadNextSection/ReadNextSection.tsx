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
      sx={{ bgcolor: "background.paper", py: { xs: 6, md: 8 } }}
    >
      <Box sx={{ maxWidth: "var(--container-editorial)", mx: "auto", px: { xs: 2, md: 4 } }}>
        <KiribeTypography
          id="read-next-heading"
          sx={{
            fontFamily: "var(--font-headline), 'Outfit', sans-serif",
            fontWeight: 400,
            fontSize: "1.5rem",
            letterSpacing: "0.025em",
            textTransform: "uppercase",
            color: "primary.main",
          }}
        >
          {title}
        </KiribeTypography>
        <Box sx={{ mt: 1, mb: 4, width: 48, height: 2, bgcolor: "secondary.main" }} />
        <Box
          sx={{
            display: "grid",
            gap: 4,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", base: "1fr 1fr 1fr" },
          }}
        >
          {articles.slice(0, 3).map((article) => (
            <ArticleCard key={article.id} article={article} variant="grid" />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

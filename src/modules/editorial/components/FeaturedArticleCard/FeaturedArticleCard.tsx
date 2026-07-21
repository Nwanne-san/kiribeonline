"use client";

import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ScheduleIcon from "@mui/icons-material/Schedule";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { ArticleCardDoc } from "@/lib/content/types";
import { KiribeImage } from "@/modules/shared/components/media/KiribeImage";
import { KiribeLink, KiribeTypography, publicRoute } from "@/modules/shared/components/ui";
import { PublicRoutes } from "@/routes/public.routes";
import { estimateReadingTime, resolveAuthorName } from "@/utils/helper";
import { CATEGORY_COLORS } from "@/theme/category-colors";

/** Split featured card — Figma V5 category archive: image left, #030712 panel right. */
export function FeaturedArticleCard({ article }: { article: ArticleCardDoc }) {
  const href = publicRoute(PublicRoutes.articleDetail, { slug: article.slug });
  const primaryCategory = article.categories?.[0];
  const accent =
    (primaryCategory?.slug &&
      CATEGORY_COLORS[primaryCategory.slug as keyof typeof CATEGORY_COLORS]?.bg) ||
    "#7F0400";
  const authorName = resolveAuthorName(article.author);
  const readLabel = article.body
    ? `${estimateReadingTime(article.body)} min read`
    : undefined;

  const metaItemSx = {
    fontSize: "0.75rem",
    lineHeight: "1rem",
    color: "#99A1AF",
  } as const;

  return (
    <KiribeLink
      href={href}
      underline="none"
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", base: "1fr 1fr" },
        "&:hover .featured-title": { color: "var(--color-mustard)" },
      }}
    >
      <Box
        sx={{
          position: "relative",
          minHeight: { xs: 260, sm: 360, base: "auto" },
          bgcolor: "#F3F4F6",
        }}
      >
        <KiribeImage
          src={article.heroImage}
          alt={article.heroImage?.alt ?? article.title}
          fill
        />
      </Box>
      <Stack
        justifyContent="center"
        sx={{ bgcolor: "#030712", p: { xs: 3, md: 5 } }}
      >
        {primaryCategory && (
          <Box
            sx={{
              alignSelf: "stretch",
              bgcolor: accent,
              color: "#fff",
              fontFamily: "var(--font-headline), 'Outfit', sans-serif",
              fontSize: "0.75rem",
              lineHeight: "1rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              px: 1.25,
              py: 0.25,
              mb: 2,
            }}
          >
            {primaryCategory.name}
          </Box>
        )}
        <KiribeTypography
          className="featured-title"
          sx={{
            fontFamily: "var(--font-headline), 'Outfit', sans-serif",
            fontWeight: 400,
            fontSize: { xs: "1.5rem", md: "1.875rem" },
            lineHeight: 1.375,
            color: "#fff",
            transition: "color var(--duration-fast) ease",
          }}
        >
          {article.title}
        </KiribeTypography>
        <Box sx={{ mt: 2, width: 40, height: 2, bgcolor: "var(--color-mustard)" }} />
        {article.excerpt && (
          <KiribeTypography
            sx={{
              mt: 2,
              color: "#D1D5DC",
              fontSize: "0.875rem",
              lineHeight: 1.625,
            }}
          >
            {article.excerpt}
          </KiribeTypography>
        )}
        {(authorName || readLabel) && (
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 3 }}>
            {authorName && (
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <PersonOutlineIcon sx={{ fontSize: 14, color: "#99A1AF" }} />
                <Box component="span" sx={metaItemSx}>{authorName}</Box>
              </Stack>
            )}
            {readLabel && (
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <ScheduleIcon sx={{ fontSize: 14, color: "#99A1AF" }} />
                <Box component="span" sx={metaItemSx}>{readLabel}</Box>
              </Stack>
            )}
          </Stack>
        )}
      </Stack>
    </KiribeLink>
  );
}

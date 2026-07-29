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

  return (
    <KiribeLink
      href={href}
      underline="none"
      className="grid grid-cols-1 base:grid-cols-2 group hover:[&_.featured-title]:text-mustard"
    >
      <Box className="relative min-h-[260px] sm:min-h-[360px] base:min-h-0 bg-surface-muted">
        <KiribeImage
          src={article.heroImage}
          alt={article.heroImage?.alt ?? article.title}
          fill
        />
      </Box>
      <Stack
        justifyContent="center"
        className="bg-[#030712] p-6 md:p-10"
      >
        {primaryCategory && (
          <Box
            className="self-stretch text-white font-headline text-xs leading-4 tracking-[0.1em] uppercase px-2.5 py-0.5 mb-4"
            style={{ backgroundColor: accent }}
          >
            {primaryCategory.name}
          </Box>
        )}
        <KiribeTypography
          className="featured-title font-headline font-normal text-2xl md:text-[1.875rem] leading-[1.375] text-white transition-colors duration-[var(--duration-fast)] ease-in-out"
        >
          {article.title}
        </KiribeTypography>
        <Box className="mt-4 w-10 h-0.5 bg-mustard" />
        {article.excerpt && (
          <KiribeTypography className="mt-4 text-[#D1D5DC] text-sm leading-[1.625]">
            {article.excerpt}
          </KiribeTypography>
        )}
        {(authorName || readLabel) && (
          <Stack direction="row" alignItems="center" spacing={2} className="mt-6">
            {authorName && (
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <PersonOutlineIcon className="text-sm text-muted-soft" />
                <Box component="span" className="text-xs leading-4 text-muted-soft">{authorName}</Box>
              </Stack>
            )}
            {readLabel && (
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <ScheduleIcon className="text-sm text-muted-soft" />
                <Box component="span" className="text-xs leading-4 text-muted-soft">{readLabel}</Box>
              </Stack>
            )}
          </Stack>
        )}
      </Stack>
    </KiribeLink>
  );
}

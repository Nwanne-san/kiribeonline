"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { ArticleCardDoc } from "@/lib/content/types";
import { CategoryBadge } from "@/modules/shared/components/CategoryBadge";
import { KiribeImage } from "@/modules/shared/components/media/KiribeImage";
import { KiribeLink, KiribeTypography, publicRoute } from "@/modules/shared/components/ui";
import { PublicRoutes } from "@/routes/public.routes";
import { getRelativeTime } from "@/utils/helper";
import { CATEGORY_COLORS } from "@/theme/category-colors";

export type ArticleCardProps = {
  article: ArticleCardDoc;
  variant?: "grid" | "list";
};

function getCategoryColor(slug?: string) {
  if (!slug) return "#6B1D2A";
  const key = slug as keyof typeof CATEGORY_COLORS;
  return CATEGORY_COLORS[key]?.border ?? "#6B1D2A";
}

const TWO_LINE_CLAMP = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
} as const;

const THREE_LINE_CLAMP = {
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
} as const;

export function ArticleCard({ article, variant = "grid" }: ArticleCardProps) {
  const href = publicRoute(PublicRoutes.articleDetail, { slug: article.slug });
  const dateLabel = article.publishedAt ? getRelativeTime(article.publishedAt) : undefined;
  const primaryCategory = article.categories?.[0];

  if (variant === "list") {
    return (
      <Box
        sx={{
          display: "flex",
          gap: 2,
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ width: 160, flexShrink: 0 }}>
          <KiribeLink href={href} underline="none">
            <KiribeImage
              src={article.heroImage}
              alt={article.heroImage?.alt ?? article.title}
              aspect="thumb"
            />
          </KiribeLink>
        </Box>
        <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
          {primaryCategory && (
            <CategoryBadge
              label={primaryCategory.name}
              color={getCategoryColor(primaryCategory.slug)}
            />
          )}
          {dateLabel && (
            <KiribeTypography variant="caption" color="text.secondary">
              {dateLabel}
            </KiribeTypography>
          )}
          <KiribeLink href={href} underline="hover" color="inherit">
            <KiribeTypography variant="cardTitle">{article.title}</KiribeTypography>
          </KiribeLink>
          {article.excerpt && (
            <KiribeTypography variant="body2" color="text.secondary" sx={{ mt: 0.5, ...TWO_LINE_CLAMP }}>
              {article.excerpt}
            </KiribeTypography>
          )}
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      <KiribeLink href={href} underline="none">
        <KiribeImage
          src={article.heroImage}
          alt={article.heroImage?.alt ?? article.title}
          aspect="card"
        />
      </KiribeLink>
      <Stack spacing={1.25} sx={{ mt: 2 }}>
        {primaryCategory && (
          <Box>
            <CategoryBadge
              label={primaryCategory.name}
              color={getCategoryColor(primaryCategory.slug)}
              variant="solid"
            />
          </Box>
        )}
        <KiribeLink href={href} underline="hover" color="inherit">
          <KiribeTypography
            variant="cardTitle"
            sx={{ fontSize: "1.125rem", lineHeight: 1.3, ...TWO_LINE_CLAMP }}
          >
            {article.title}
          </KiribeTypography>
        </KiribeLink>
        {article.excerpt && (
          <KiribeTypography variant="body2" color="text.secondary" sx={THREE_LINE_CLAMP}>
            {article.excerpt}
          </KiribeTypography>
        )}
      </Stack>
    </Box>
  );
}

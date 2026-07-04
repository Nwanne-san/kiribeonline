"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import type { ArticleCardDoc } from "@/lib/content/types";
import { KiribeLink, KiribeTypography, publicRoute } from "@/modules/shared/components/ui";
import { PublicRoutes } from "@/routes/public.routes";
import { CATEGORY_COLORS } from "@/theme/category-colors";

type EditorsPicksListProps = {
  picks: ArticleCardDoc[];
};

function categoryAccent(slug?: string): string {
  if (!slug) return "#C9A227";
  const key = slug as keyof typeof CATEGORY_COLORS;
  return CATEGORY_COLORS[key]?.text ?? "#C9A227";
}

const TWO_LINE_CLAMP = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
} as const;

export function EditorsPicksList({ picks }: EditorsPicksListProps) {
  return (
    <Stack spacing={0}>
      <KiribeTypography
        variant="h3"
        sx={{
          color: "primary.main",
          fontSize: "1.25rem",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        Editor&apos;s Picks
      </KiribeTypography>
      <Box sx={{ width: 48, height: 2, bgcolor: "secondary.main", mt: 1, mb: 2.5 }} />

      {picks.length === 0 && (
        <Box
          sx={{
            py: 3,
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 1,
            textAlign: "center",
            color: "text.secondary",
          }}
        >
          <KiribeTypography variant="body2" sx={{ color: "inherit" }}>
            Editor&rsquo;s picks will appear here.
          </KiribeTypography>
        </Box>
      )}

      <Stack divider={<Divider flexItem />} spacing={0}>
        {picks.slice(0, 5).map((article) => {
          const category = article.categories?.[0];
          const href = publicRoute(PublicRoutes.articleDetail, { slug: article.slug });
          return (
            <Stack key={article.id} spacing={0.5} sx={{ py: 1.75 }}>
              {category && (
                <KiribeTypography
                  variant="kicker"
                  sx={{ color: categoryAccent(category.slug), display: "block" }}
                >
                  {category.name}
                </KiribeTypography>
              )}
              <KiribeLink href={href} underline="hover" color="inherit">
                <KiribeTypography
                  sx={{
                    fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                    fontSize: "1rem",
                    fontWeight: 600,
                    lineHeight: 1.35,
                    color: "text.primary",
                    ...TWO_LINE_CLAMP,
                  }}
                >
                  {article.title}
                </KiribeTypography>
              </KiribeLink>
            </Stack>
          );
        })}
      </Stack>

      <KiribeLink
        href={PublicRoutes.articles}
        underline="hover"
        sx={{
          mt: 2.5,
          color: "primary.main",
          fontWeight: 600,
          fontSize: "0.875rem",
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        More News
        <ArrowForwardIcon sx={{ fontSize: 16 }} />
      </KiribeLink>
    </Stack>
  );
}

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

export function EditorsPicksList({ picks }: EditorsPicksListProps) {
  return (
    <Stack spacing={0}>
      <KiribeTypography
        variant="h3"
        className="text-burgundy text-[1.25rem] tracking-[0.04em] uppercase"
      >
        Editor&apos;s Picks
      </KiribeTypography>
      <Box className="w-12 h-0.5 bg-mustard mt-2 mb-5" />

      {picks.length === 0 && (
        <Box className="py-6 border border-dashed border-border rounded text-center text-ink-secondary">
          <KiribeTypography variant="body2" className="text-inherit">
            Editor&rsquo;s picks will appear here.
          </KiribeTypography>
        </Box>
      )}

      <Stack divider={<Divider flexItem />} spacing={0}>
        {picks.slice(0, 5).map((article) => {
          const category = article.categories?.[0];
          const href = publicRoute(PublicRoutes.articleDetail, { slug: article.slug });
          return (
            <Stack key={article.id} spacing={0.5} className="py-3.5">
              {category && (
                <KiribeTypography
                  variant="kicker"
                  className="block"
                  style={{ color: categoryAccent(category.slug) }}
                >
                  {category.name}
                </KiribeTypography>
              )}
              <KiribeLink href={href} underline="hover" color="inherit">
                <KiribeTypography className="font-headline text-base font-semibold leading-[1.35] text-ink line-clamp-2">
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
        className="mt-5 text-burgundy font-semibold text-sm inline-flex items-center gap-1"
      >
        More News
        <ArrowForwardIcon className="text-[16px]" />
      </KiribeLink>
    </Stack>
  );
}

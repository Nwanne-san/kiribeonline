"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { AdjacentArticle } from "@/lib/content/query-adjacent";
import {
  KiribeLink,
  KiribeTypography,
  publicRoute,
} from "@/modules/shared/components/ui";
import { cn } from "@/modules/shared/components/tw";
import { PublicRoutes } from "@/routes/public.routes";

type PrevNextArticleNavProps = {
  prev: AdjacentArticle | null;
  next: AdjacentArticle | null;
};

function Slot({
  article,
  direction,
}: {
  article: AdjacentArticle;
  direction: "prev" | "next";
}) {
  const href = publicRoute(PublicRoutes.articleDetail, { slug: article.slug });
  const isPrev = direction === "prev";
  const label = isPrev ? "Previous article" : "Next article";
  const Icon = isPrev ? ArrowBackIcon : ArrowForwardIcon;
  return (
    <KiribeLink
      href={href}
      underline="none"
      color="inherit"
      aria-label={`${label}: ${article.title}`}
      className={cn(
        "group flex items-center gap-4 py-5 flex-1 min-w-0 hover:[&_.prev-next-title]:text-burgundy",
        isPrev ? "flex-row text-left" : "flex-row-reverse text-right"
      )}
    >
      <Box
        aria-hidden="true"
        className="flex items-center justify-center w-10 h-10 rounded-full border border-border text-burgundy shrink-0 transition-[background-color,border-color] duration-[var(--duration-fast)] ease-in-out group-hover:bg-mustard group-hover:border-mustard group-hover:text-white"
      >
        <Icon className="text-[18px]" />
      </Box>
      <Stack spacing={0.5} className="min-w-0 flex-1">
        <KiribeTypography className="font-headline text-[0.6875rem] font-semibold tracking-[0.12em] uppercase text-muted-soft">
          {label}
        </KiribeTypography>
        <KiribeTypography className="prev-next-title font-headline font-medium text-[0.9375rem] md:text-base leading-[1.35] text-ink transition-colors duration-[var(--duration-fast)] ease-in-out line-clamp-2">
          {article.title}
        </KiribeTypography>
      </Stack>
    </KiribeLink>
  );
}

/**
 * Compact footer nav for chronological browsing within the current article's
 * primary category (with a site-wide fallback per slot). Only renders when at
 * least one side has an article — a lone piece with no siblings shows nothing.
 */
export function PrevNextArticleNav({ prev, next }: PrevNextArticleNavProps) {
  if (!prev && !next) return null;

  return (
    <Box
      component="nav"
      aria-label="Article navigation"
      className="border-t border-b border-border bg-surface"
    >
      <Box className="editorial-container">
        <Stack
          direction={{ xs: "column", sm: "row" }}
          divider={
            <Box className="w-full sm:w-px h-px sm:h-auto bg-border" />
          }
          className="items-stretch"
        >
          <Box className="flex-1 flex min-w-0">
            {prev ? <Slot article={prev} direction="prev" /> : <Box className="flex-1" />}
          </Box>
          <Box className="flex-1 flex min-w-0">
            {next ? <Slot article={next} direction="next" /> : <Box className="flex-1" />}
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

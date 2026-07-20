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
import { PublicRoutes } from "@/routes/public.routes";

type PrevNextArticleNavProps = {
  prev: AdjacentArticle | null;
  next: AdjacentArticle | null;
};

const TWO_LINE_CLAMP = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
} as const;

const kickerSx = {
  fontFamily: "var(--font-headline), 'Outfit', sans-serif",
  fontSize: "0.6875rem",
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#99A1AF",
} as const;

const titleSx = {
  fontFamily: "var(--font-headline), 'Outfit', sans-serif",
  fontWeight: 500,
  fontSize: { xs: "0.9375rem", md: "1rem" },
  lineHeight: 1.35,
  color: "text.primary",
  transition: "color var(--duration-fast) ease",
  ...TWO_LINE_CLAMP,
} as const;

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
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        py: 2.5,
        flex: 1,
        minWidth: 0,
        flexDirection: isPrev ? "row" : "row-reverse",
        textAlign: isPrev ? "left" : "right",
        "&:hover .prev-next-title": { color: "primary.main" },
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "1px solid",
          borderColor: "divider",
          color: "primary.main",
          flexShrink: 0,
          transition: "background-color var(--duration-fast) ease, border-color var(--duration-fast) ease",
          "a:hover &": {
            bgcolor: "var(--color-mustard)",
            borderColor: "var(--color-mustard)",
            color: "#fff",
          },
        }}
      >
        <Icon sx={{ fontSize: 18 }} />
      </Box>
      <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
        <KiribeTypography sx={kickerSx}>{label}</KiribeTypography>
        <KiribeTypography className="prev-next-title" sx={titleSx}>
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
      sx={{
        borderTop: "1px solid",
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          divider={
            <Box
              sx={{
                width: { xs: "100%", sm: "1px" },
                height: { xs: "1px", sm: "auto" },
                bgcolor: "divider",
              }}
            />
          }
          sx={{ alignItems: "stretch" }}
        >
          <Box sx={{ flex: 1, display: "flex", minWidth: 0 }}>
            {prev ? <Slot article={prev} direction="prev" /> : <Box sx={{ flex: 1 }} />}
          </Box>
          <Box sx={{ flex: 1, display: "flex", minWidth: 0 }}>
            {next ? <Slot article={next} direction="next" /> : <Box sx={{ flex: 1 }} />}
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

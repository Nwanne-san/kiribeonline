"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { resolvePublicByline } from "@/lib/content/byline";
import { formatBylineDate } from "@/utils/helper";

type BylineArticle = {
  author?: { id?: string | number; name?: string | null } | string | null;
  hideByline?: boolean | null;
  publishedAt?: string | null;
};

type ArticleBylineProps = {
  article: BylineArticle;
  /** `sm` for list rows and picks, `md` for hero/featured placements. */
  size?: "sm" | "md";
  sx?: object;
};

/**
 * `Nwanne Nnamani · 2 days ago` — the standard editorial byline.
 *
 * The name honours the writer's public-byline opt-out (see
 * `resolvePublicByline`), and the date reads relative while a story is fresh,
 * falling back to `DD-MM-YYYY` after a week.
 */
export function ArticleByline({ article, size = "sm", sx }: ArticleBylineProps) {
  const name = resolvePublicByline(article);
  const { publishedAt } = article;

  const textSx = {
    fontSize: size === "md" ? "0.875rem" : "0.75rem",
    lineHeight: size === "md" ? "1.25rem" : "1rem",
    color: "#6A7282",
  } as const;

  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={sx} flexWrap="wrap">
      <Box component="span" sx={{ ...textSx, fontWeight: 600, color: "#4A5565" }}>
        {name}
      </Box>
      {publishedAt && (
        <>
          <Box component="span" sx={textSx} aria-hidden>
            ·
          </Box>
          {/* Relative label can differ across the SSR/hydration boundary; the
              exact instant stays in `dateTime` for crawlers. */}
          <Box component="time" dateTime={publishedAt} sx={textSx} suppressHydrationWarning>
            {formatBylineDate(publishedAt)}
          </Box>
        </>
      )}
    </Stack>
  );
}

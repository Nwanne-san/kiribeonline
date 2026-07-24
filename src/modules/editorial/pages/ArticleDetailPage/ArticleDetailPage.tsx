"use client";

import { useEffect, useRef } from "react";
import { Suspense } from "react";
import ScheduleIcon from "@mui/icons-material/Schedule";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { richTextConverters } from "@/modules/shared/components/feedback";
import type { Article } from "@/modules/shared/types/content";
import type { ArticleCardDoc } from "@/lib/content/types";
import {
  ArticleCard,
  ArticleNewsletterCta,
  ArticleShareRow,
  BackToTop,
  MostReadList,
  PrevNextArticleNav,
  ReadingProgress,
  ReadNextSection,
} from "@/modules/editorial/components";
import type { AdjacentArticle } from "@/lib/content/query-adjacent";
import { CategoryBadge } from "@/modules/shared/components/CategoryBadge";
import { KiribeImage } from "@/modules/shared/components/media/KiribeImage";
import {
  KiribeLink,
  KiribeTypography,
  publicRoute,
} from "@/modules/shared/components/ui";
import { PublicRoutes } from "@/routes/public.routes";
import { estimateReadingTime, formatDate, resolveAuthorName } from "@/utils/helper";
import { CATEGORY_COLORS } from "@/theme/category-colors";

type ArticleDetailPageProps = {
  article: Article;
  relatedArticles?: ArticleCardDoc[];
  /**
   * Optional "Most Read" leaderboard rendered below the article body. Empty or
   * omitted → the section is skipped entirely (no dangling header on cold sites).
   */
  mostReadArticles?: ArticleCardDoc[];
  /**
   * "Read next" — scored recommendations (tag overlap → same-category →
   * site-wide newest). Distinct from `relatedArticles` (legacy same-category
   * grid). For published articles this should always contain ≥1 item.
   */
  readNextArticles?: ArticleCardDoc[];
  /** Chronological prev/next within the primary category (site-wide fallback). */
  adjacentArticles?: { prev: AdjacentArticle | null; next: AdjacentArticle | null };
};

const BODY_WIDTH = 832;

const AUTHOR_FALLBACK = "Kiribé Editorial";

function categoryColor(slug?: string) {
  if (!slug) return "#7F0400";
  return CATEGORY_COLORS[slug as keyof typeof CATEGORY_COLORS]?.bg ?? "#7F0400";
}

function authorInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "K";
}

const proseSx = {
  "& h2": {
    fontFamily: "var(--font-headline), 'Outfit', sans-serif",
    fontWeight: 400,
    fontSize: "clamp(1.5rem, 1.37rem + 0.55vw, 1.875rem)",
    lineHeight: 1.3,
    color: "primary.main",
    mt: 6,
    mb: 2,
  },
  "& h3": {
    fontFamily: "var(--font-headline), 'Outfit', sans-serif",
    fontWeight: 400,
    fontSize: "1.375rem",
    color: "primary.main",
    mt: 4,
    mb: 1.5,
  },
  "& p": {
    fontFamily: "var(--font-body), 'Open Sans', sans-serif",
    fontSize: "1.125rem",
    lineHeight: 1.65,
    color: "#1E2939",
    mb: 3,
  },
  "& a": { color: "primary.main", textDecoration: "underline" },
  "& blockquote": {
    borderLeft: "4px solid var(--color-mustard)",
    pl: 3,
    my: 4,
    fontFamily: "var(--font-headline), 'Outfit', sans-serif",
    fontSize: "1.5rem",
    lineHeight: 1.4,
    color: "primary.main",
  },
  "& ul, & ol": {
    pl: 3,
    mb: 3,
    "& li": { fontSize: "1.125rem", color: "#1E2939", mb: 1, lineHeight: 1.6 },
  },
  "& img": { width: "100%", height: "auto", my: 4 },
  "& figure": { my: 4 },
  "& figcaption": { fontSize: "0.875rem", fontStyle: "italic", color: "#6A7282", mt: 1 },
  /* CMS-authored embeds (iframes, video) may declare intrinsic widths wider
     than the 832px reading column — cap them so a wide YouTube or Twitter
     embed can't force a horizontal scrollbar on phones. */
  "& iframe, & video, & object, & embed": {
    display: "block",
    maxWidth: "100%",
    my: 3,
  },
  /* Tables and <pre> can be genuinely wider than the column (code blocks,
     data tables). Wrap them so they scroll *inside* the article instead of
     pushing the whole page. Uses the parent `& > table` selector so raw
     rich-text tables get the same treatment even without a wrapper element. */
  "& > table, & > pre, & .table-wrap": {
    display: "block",
    maxWidth: "100%",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    my: 3,
  },
} as const;

function ArticleDetailContent({
  article,
  relatedArticles = [],
  mostReadArticles = [],
  readNextArticles = [],
  adjacentArticles = { prev: null, next: null },
}: ArticleDetailPageProps) {
  // Count one view per article per browser session. The ref guards against React
  // Strict Mode's double-invoke / remounts within a render, and the
  // sessionStorage key stops repeat counts on back-navigation to the same article.
  const trackedSlug = useRef<string | null>(null);
  useEffect(() => {
    if (trackedSlug.current === article.slug) return;
    trackedSlug.current = article.slug;

    const storageKey = `kiribe:viewed:${article.slug}`;
    try {
      if (sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // sessionStorage unavailable (private mode / SSR guard) — fall through and
      // still record the view; the ref alone prevents the Strict Mode double-fire.
    }

    void fetch("/api/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: article.slug }),
    });
  }, [article.slug]);

  const primaryCategory = article.categories?.[0];
  const otherCategories = article.categories?.slice(1) ?? [];
  const accent = categoryColor(primaryCategory?.slug);
  const readingTime = estimateReadingTime(article.body);
  const authorName = resolveAuthorName(article.author) ?? AUTHOR_FALLBACK;

  return (
    <Box component="article">
      {/* Reading aids — measure this <article>, not the whole page, so the bar
          hits 100% at the end of the story (before footer / CTA). */}
      <ReadingProgress target="article" />
      <BackToTop />

      {/* ── Breadcrumb ───────────────────────────────────────── */}
      <Box sx={{ bgcolor: "#F9FAFB", borderBottom: "1px solid", borderColor: "divider" }}>
        <Box sx={{ maxWidth: "var(--container-editorial)", mx: "auto", px: { xs: 2, md: 4 } }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ py: 1, overflow: "hidden" }}
          >
            <KiribeLink
              href={PublicRoutes.home}
              underline="none"
              sx={{ fontSize: "1rem", color: "#6A7282", "&:hover": { color: "primary.main" } }}
            >
              Home
            </KiribeLink>
            {primaryCategory && (
              <>
                <Box component="span" sx={{ color: "#D1D5DC", fontSize: "0.75rem" }}>/</Box>
                <KiribeLink
                  href={publicRoute(PublicRoutes.categoryDetail, { slug: primaryCategory.slug })}
                  underline="none"
                  sx={{ fontSize: "1rem", color: "#6A7282", "&:hover": { color: "primary.main" } }}
                >
                  {primaryCategory.name}
                </KiribeLink>
              </>
            )}
            <Box component="span" sx={{ color: "#D1D5DC", fontSize: "0.75rem" }}>/</Box>
            <KiribeTypography
              sx={{
                fontSize: "0.75rem",
                color: "#99A1AF",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {article.title}
            </KiribeTypography>
          </Stack>
        </Box>
      </Box>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          bgcolor: "#101828",
          display: "flex",
          alignItems: "flex-end",
          minHeight: { xs: 460, md: 640 },
        }}
      >
        {article.heroImage && (
          <Box sx={{ position: "absolute", inset: 0, opacity: 0.8 }}>
            <KiribeImage
              src={article.heroImage}
              alt={article.heroImage.alt ?? article.title}
              fill
              priority
            />
          </Box>
        )}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(0deg, #030712 0%, rgba(16,24,40,0.6) 50%, rgba(0,0,0,0) 100%)",
          }}
        />
        <Box
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: BODY_WIDTH,
            mx: "auto",
            px: { xs: 3, md: 4 },
            pt: { xs: 12, md: 16 },
            pb: { xs: 6, md: 10 },
          }}
        >
          <Stack direction="row" spacing={1} sx={{ mb: 2.5, flexWrap: "wrap", gap: 1 }}>
            {primaryCategory && (
              <CategoryBadge label={primaryCategory.name} color={accent} variant="solid" />
            )}
            {otherCategories.map((cat) => (
              <Box
                key={cat.id}
                component="span"
                sx={{
                  fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                  fontSize: "0.75rem",
                  lineHeight: "1rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  px: 1.5,
                  py: 0.5,
                  border: "1px solid rgba(255,255,255,0.4)",
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                {cat.name}
              </Box>
            ))}
          </Stack>

          <KiribeTypography
            variant="h1"
            component="h1"
            sx={{
              fontFamily: "var(--font-headline), 'Outfit', sans-serif",
              fontWeight: 400,
              fontSize: "var(--text-display)",
              lineHeight: 1.25,
              color: "#fff",
            }}
          >
            {article.title}
          </KiribeTypography>

          <Stack
            direction="row"
            spacing={2.5}
            alignItems="center"
            sx={{ mt: 2.5, flexWrap: "wrap", gap: 1.5, color: "rgba(255,255,255,0.7)" }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  bgcolor: "var(--color-mustard)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-body), 'Open Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  flexShrink: 0,
                }}
              >
                {authorInitial(authorName)}
              </Box>
              <KiribeTypography
                sx={{
                  fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  color: "#fff",
                }}
              >
                {authorName}
              </KiribeTypography>
            </Stack>
            <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.3)" }} />
            {article.publishedAt && (
              <KiribeTypography sx={{ fontSize: "0.875rem", color: "inherit" }}>
                {formatDate(article.publishedAt)}
              </KiribeTypography>
            )}
            <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.3)" }} />
            <Stack direction="row" spacing={0.75} alignItems="center">
              <ScheduleIcon sx={{ fontSize: 14 }} />
              <KiribeTypography sx={{ fontSize: "0.875rem", color: "inherit" }}>
                {readingTime} min read
              </KiribeTypography>
            </Stack>
          </Stack>
        </Box>
      </Box>

      {/* ── Body ─────────────────────────────────────────────── */}
      <Box sx={{ maxWidth: BODY_WIDTH, mx: "auto", px: { xs: 3, md: 4 } }}>
        {article.excerpt && (
          <Box sx={{ pt: { xs: 5, md: 6 }, pb: 4, borderBottom: "1px solid", borderColor: "divider" }}>
            <Box sx={{ width: 48, height: 4, bgcolor: "var(--color-mustard)", mb: 3 }} />
            <KiribeTypography
              // `data-speakable` marks this block as the standfirst that
              // voice/AI assistants should read (see NewsArticle
              // `speakable.cssSelector` in `src/lib/seo/json-ld.tsx`).
              data-speakable="excerpt"
              sx={{
                fontFamily: "var(--font-body), 'Open Sans', sans-serif",
                fontWeight: 300,
                fontSize: "clamp(1.125rem, 1.02rem + 0.5vw, 1.5rem)",
                lineHeight: 1.625,
                color: "#364153",
              }}
            >
              {article.excerpt}
            </KiribeTypography>
          </Box>
        )}

        <Box sx={{ py: { xs: 4, md: 5 }, ...proseSx }}>
          <RichText data={article.body as never} converters={richTextConverters} />
        </Box>

        {/* Tags */}
        {article.tags?.length > 0 && (
          <Box sx={{ py: 4, borderTop: "1px solid", borderColor: "divider" }}>
            <KiribeTypography
              sx={{
                fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                fontSize: "0.75rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#99A1AF",
                mb: 2,
              }}
            >
              Tags
            </KiribeTypography>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              {article.tags.map((tag) => (
                <KiribeLink
                  key={tag.id}
                  // Canonical tag archive lives at /tags/[slug]. The old
                  // ?tag= filter on /articles still works — this just prefers
                  // the canonical URL going forward.
                  href={publicRoute(PublicRoutes.tagDetail, { slug: tag.slug })}
                  underline="none"
                >
                  <CategoryBadge label={tag.name} color={accent} variant="outline" />
                </KiribeLink>
              ))}
            </Stack>
          </Box>
        )}

        {/* Share */}
        <ArticleShareRow title={article.title} />

        {/* Editorial author card */}
        <Box sx={{ pt: 4, borderTop: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" spacing={2.5} sx={{ bgcolor: "#F9FAFB", p: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                bgcolor: "primary.main",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "1.25rem",
              }}
            >
              {authorInitial(authorName)}
            </Box>
            <Box>
              <KiribeTypography
                sx={{
                  fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                  fontSize: "1.125rem",
                  color: "#000",
                }}
              >
                {authorName}
              </KiribeTypography>
              <KiribeTypography sx={{ mt: 0.25, fontSize: "0.875rem", color: "var(--color-mustard)" }}>
                Contributor
              </KiribeTypography>
              <KiribeTypography sx={{ mt: 1.5, fontSize: "0.875rem", lineHeight: 1.625, color: "#4A5565" }}>
                {authorName} is a contributor to Kiribé, covering culture, cinema,
                and the intersection of art and society across the African
                continent and beyond.
              </KiribeTypography>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* ── Most read (below body, sidebar variant) ──────────── */}
      {mostReadArticles.length > 0 && (
        <Box sx={{ maxWidth: BODY_WIDTH, mx: "auto", px: { xs: 3, md: 4 }, mt: { xs: 4, md: 6 } }}>
          <MostReadList articles={mostReadArticles} variant="sidebar" />
        </Box>
      )}

      {/* ── Related articles ─────────────────────────────────── */}
      {relatedArticles.length > 0 && (
        <Box component="section" sx={{ bgcolor: "#F9FAFB", py: { xs: 8, md: 8 }, mt: { xs: 4, md: 4 } }}>
          <Box sx={{ maxWidth: "var(--container-editorial)", mx: "auto", px: { xs: 2, md: 4 } }}>
            <KiribeTypography
              sx={{
                fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                fontWeight: 400,
                fontSize: "1.5rem",
                letterSpacing: "0.025em",
                textTransform: "uppercase",
                color: "primary.main",
              }}
            >
              Related Articles
            </KiribeTypography>
            <Box sx={{ mt: 1, mb: 4, width: 48, height: 2, bgcolor: "var(--color-mustard)" }} />
            <Box
              sx={{
                display: "grid",
                gap: 4,
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", base: "1fr 1fr 1fr" },
              }}
            >
              {relatedArticles.map((related) => (
                <ArticleCard key={related.id} article={related} variant="grid" surface="panel" />
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* ── Read next (tag-scored recommendations) ────────────── */}
      <ReadNextSection articles={readNextArticles} />

      {/* ── Prev / next chronological within primary category ─── */}
      <PrevNextArticleNav prev={adjacentArticles.prev} next={adjacentArticles.next} />

      {/* ── Newsletter CTA ───────────────────────────────────── */}
      <ArticleNewsletterCta />
    </Box>
  );
}

export function ArticleDetailPage(props: ArticleDetailPageProps) {
  return (
    <Suspense fallback={null}>
      <ArticleDetailContent {...props} />
    </Suspense>
  );
}

export type { ArticleDetailPageProps };

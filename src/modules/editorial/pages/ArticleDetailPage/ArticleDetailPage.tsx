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
import { cn } from "@/modules/shared/components/tw";
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
      <Box className="bg-surface-alt border-b border-border">
        <Box className="editorial-container">
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            className="py-2 overflow-hidden"
          >
            <KiribeLink
              href={PublicRoutes.home}
              underline="none"
              className="text-base text-muted hover:text-burgundy"
            >
              Home
            </KiribeLink>
            {primaryCategory && (
              <>
                <Box component="span" className="text-muted-soft text-xs">/</Box>
                <KiribeLink
                  href={publicRoute(PublicRoutes.categoryDetail, { slug: primaryCategory.slug })}
                  underline="none"
                  className="text-base text-muted hover:text-burgundy"
                >
                  {primaryCategory.name}
                </KiribeLink>
              </>
            )}
            <Box component="span" className="text-muted-soft text-xs">/</Box>
            <KiribeTypography className="text-xs text-muted-soft truncate">
              {article.title}
            </KiribeTypography>
          </Stack>
        </Box>
      </Box>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <Box className="relative overflow-hidden bg-footer flex items-end min-h-[460px] md:min-h-[640px]">
        {article.heroImage && (
          <Box className="absolute inset-0 opacity-80">
            <KiribeImage
              src={article.heroImage}
              alt={article.heroImage.alt ?? article.title}
              fill
              priority
            />
          </Box>
        )}
        <Box
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(0deg, #030712 0%, rgba(16,24,40,0.6) 50%, rgba(0,0,0,0) 100%)",
          }}
        />
        <Box
          className="relative w-full mx-auto px-6 md:px-8 pt-12 md:pt-16 pb-6 md:pb-10"
          style={{ maxWidth: BODY_WIDTH }}
        >
          <Stack direction="row" spacing={1} className="mb-5 flex-wrap gap-2">
            {primaryCategory && (
              <CategoryBadge label={primaryCategory.name} color={accent} variant="solid" />
            )}
            {otherCategories.map((cat) => (
              <Box
                key={cat.id}
                component="span"
                className="font-headline text-xs leading-4 tracking-[0.1em] uppercase px-1.5 py-0.5 border border-white/40 text-white/80"
              >
                {cat.name}
              </Box>
            ))}
          </Stack>

          <KiribeTypography
            variant="h1"
            component="h1"
            className="font-headline font-normal text-[length:var(--text-display)] leading-tight text-white"
          >
            {article.title}
          </KiribeTypography>

          <Stack
            direction="row"
            spacing={2.5}
            alignItems="center"
            className="mt-2.5 flex-wrap gap-1.5 text-white/70"
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Box className="w-6 h-6 rounded-full bg-mustard text-white flex items-center justify-center font-body font-bold text-xs shrink-0">
                {authorInitial(authorName)}
              </Box>
              <KiribeTypography className="font-headline font-bold text-sm text-white">
                {authorName}
              </KiribeTypography>
            </Stack>
            <Box className="w-1 h-1 rounded-full bg-white/30" />
            {article.publishedAt && (
              <KiribeTypography className="text-sm text-inherit">
                {formatDate(article.publishedAt)}
              </KiribeTypography>
            )}
            <Box className="w-1 h-1 rounded-full bg-white/30" />
            <Stack direction="row" spacing={0.75} alignItems="center">
              <ScheduleIcon className="text-[14px]" />
              <KiribeTypography className="text-sm text-inherit">
                {readingTime} min read
              </KiribeTypography>
            </Stack>
          </Stack>
        </Box>
      </Box>

      {/* ── Body ─────────────────────────────────────────────── */}
      <Box className="mx-auto px-6 md:px-8" style={{ maxWidth: BODY_WIDTH }}>
        {article.excerpt && (
          <Box className="pt-10 md:pt-12 pb-8 border-b border-border">
            <Box className="w-12 h-1 bg-mustard mb-3" />
            <KiribeTypography
              // `data-speakable` marks this block as the standfirst that
              // voice/AI assistants should read (see NewsArticle
              // `speakable.cssSelector` in `src/lib/seo/json-ld.tsx`).
              data-speakable="excerpt"
              className="font-body font-light text-[clamp(1.125rem,1.02rem+0.5vw,1.5rem)] leading-[1.625] text-ink-secondary"
            >
              {article.excerpt}
            </KiribeTypography>
          </Box>
        )}

        <Box className={cn("article-prose py-8 md:py-10")}>
          <RichText data={article.body as never} converters={richTextConverters} />
        </Box>

        {/* Tags */}
        {article.tags?.length > 0 && (
          <Box className="py-8 border-t border-border">
            <KiribeTypography className="font-headline text-xs tracking-[0.1em] uppercase text-muted-soft mb-2">
              Tags
            </KiribeTypography>
            <Stack direction="row" className="flex-wrap gap-2">
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
        <Box className="pt-8 border-t border-border">
          <Stack direction="row" spacing={2.5} className="bg-surface-alt p-6">
            <Box className="w-14 h-14 rounded-full bg-burgundy text-white flex items-center justify-center shrink-0 font-headline font-bold text-xl">
              {authorInitial(authorName)}
            </Box>
            <Box>
              <KiribeTypography className="font-headline text-lg text-black">
                {authorName}
              </KiribeTypography>
              <KiribeTypography className="mt-0.5 text-sm text-mustard">
                Contributor
              </KiribeTypography>
              <KiribeTypography className="mt-3 text-sm leading-[1.625] text-ink-secondary">
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
        <Box className="mx-auto px-6 md:px-8 mt-6 md:mt-8" style={{ maxWidth: BODY_WIDTH }}>
          <MostReadList articles={mostReadArticles} variant="sidebar" />
        </Box>
      )}

      {/* ── Related articles ─────────────────────────────────── */}
      {relatedArticles.length > 0 && (
        <Box component="section" className="bg-surface-alt py-16 mt-6 md:mt-8">
          <Box className="editorial-container">
            <KiribeTypography className="font-headline font-normal text-2xl tracking-wide uppercase text-burgundy">
              Related Articles
            </KiribeTypography>
            <Box className="mt-1 mb-8 w-12 h-0.5 bg-mustard" />
            <Box className="grid gap-8 grid-cols-1 md:grid-cols-2 base:grid-cols-3">
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

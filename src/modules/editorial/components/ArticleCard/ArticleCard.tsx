"use client";

import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { ArticleCardDoc } from "@/lib/content/types";
import { CategoryBadge } from "@/modules/shared/components/CategoryBadge";
import { KiribeImage } from "@/modules/shared/components/media/KiribeImage";
import { KiribeLink, KiribeTypography, publicRoute } from "@/modules/shared/components/ui";
import { cn } from "@/modules/shared/components/tw";
import { PublicRoutes } from "@/routes/public.routes";
import { estimateReadingTime, formatDate, resolveAuthorName } from "@/utils/helper";
import { CATEGORY_COLORS } from "@/theme/category-colors";

export type ArticleCardProps = {
  article: ArticleCardDoc;
  variant?: "grid" | "list";
  /** `panel` renders the white padded card used on gray sections (related articles). */
  surface?: "plain" | "panel";
};

function getCategoryColor(slug?: string) {
  if (!slug) return "#7F0400";
  const key = slug as keyof typeof CATEGORY_COLORS;
  return CATEGORY_COLORS[key]?.bg ?? "#7F0400";
}

const cardTitleClass =
  "card-title font-headline font-normal text-base leading-[1.375rem] text-black transition-colors duration-[var(--duration-fast)] line-clamp-2";

const metaTextClass = "text-[0.75rem] leading-4 text-muted-soft whitespace-nowrap";

/** `author · date · read time` row with interpunct separators (Figma V5). */
function CardMetaRow({
  items,
  gap = 1.5,
  className,
}: {
  items: Array<string | undefined>;
  gap?: number;
  className?: string;
}) {
  const visible = items.filter((item): item is string => Boolean(item));
  if (visible.length === 0) return null;
  return (
    <Stack direction="row" alignItems="center" spacing={gap} className={className}>
      {visible.map((item, i) => (
        <Stack key={`${item}-${i}`} direction="row" alignItems="center" spacing={gap}>
          {i > 0 && (
            <Box component="span" className={metaTextClass}>
              ·
            </Box>
          )}
          <Box component="span" className={metaTextClass}>
            {item}
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}

export function ArticleCard({ article, variant = "grid", surface = "plain" }: ArticleCardProps) {
  const href = publicRoute(PublicRoutes.articleDetail, { slug: article.slug });
  const dateLabel = article.publishedAt ? formatDate(article.publishedAt) : undefined;
  const primaryCategory = article.categories?.[0];
  const accent = getCategoryColor(primaryCategory?.slug);
  const authorName = resolveAuthorName(article.author);
  const readLabel = article.body
    ? `${estimateReadingTime(article.body)} min read`
    : undefined;

  if (variant === "list") {
    return (
      <KiribeLink
        href={href}
        underline="none"
        className="group flex items-center gap-5 px-2 py-6 transition-colors duration-[var(--duration-fast)] hover:bg-surface-alt"
        style={{ ["--card-accent" as string]: accent }}
      >
        <Box className="relative h-[78px] w-[112px] shrink-0 bg-surface-muted sm:h-[112px] sm:w-[160px]">
          <KiribeImage
            src={article.heroImage}
            alt={article.heroImage?.alt ?? article.title}
            fill
          />
        </Box>
        <Box className="min-w-0 flex-1">
          {primaryCategory && (
            <Box className="mb-2">
              <CategoryBadge label={primaryCategory.name} color={accent} variant="solid" />
            </Box>
          )}
          <KiribeTypography
            className={cn(cardTitleClass, "group-hover:text-[var(--card-accent)]")}
          >
            {article.title}
          </KiribeTypography>
          {article.excerpt && (
            <KiribeTypography className="mt-1 line-clamp-1 text-sm leading-5 text-muted">
              {article.excerpt}
            </KiribeTypography>
          )}
          <CardMetaRow items={[authorName, dateLabel, readLabel]} className="mt-2" />
        </Box>
        <KeyboardArrowRightIcon
          className="card-chevron hidden shrink-0 text-[20px] text-muted-soft transition-[color,transform] duration-[var(--duration-fast)] group-hover:translate-x-0.5 group-hover:text-[var(--card-accent)] sm:block"
        />
      </KiribeLink>
    );
  }

  if (surface === "panel") {
    return (
      <KiribeLink
        href={href}
        underline="none"
        className="group block bg-surface"
        style={{ ["--card-accent" as string]: accent }}
      >
        <Box className="relative aspect-[4/3] bg-surface-muted">
          <KiribeImage
            src={article.heroImage}
            alt={article.heroImage?.alt ?? article.title}
            fill
          />
        </Box>
        <Box className="p-5">
          {primaryCategory && (
            <CategoryBadge label={primaryCategory.name} color={accent} variant="solid" />
          )}
          <KiribeTypography
            className={cn(cardTitleClass, "mt-3 group-hover:text-[var(--card-accent)]")}
          >
            {article.title}
          </KiribeTypography>
          <CardMetaRow items={[authorName, readLabel ?? dateLabel]} className="mt-2" />
        </Box>
      </KiribeLink>
    );
  }

  return (
    <Box style={{ ["--card-accent" as string]: accent }}>
      <KiribeLink href={href} underline="none">
        <Box className="relative aspect-[4/3] bg-surface-muted">
          <KiribeImage
            src={article.heroImage}
            alt={article.heroImage?.alt ?? article.title}
            fill
          />
          {primaryCategory && (
            <Box className="absolute top-3 left-3">
              <CategoryBadge label={primaryCategory.name} color={accent} variant="solid" />
            </Box>
          )}
        </Box>
      </KiribeLink>
      <KiribeLink href={href} underline="none" className="group">
        <KiribeTypography
          className={cn(cardTitleClass, "mt-4 group-hover:text-[var(--card-accent)]")}
        >
          {article.title}
        </KiribeTypography>
      </KiribeLink>
      {article.excerpt && (
        <KiribeTypography className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
          {article.excerpt}
        </KiribeTypography>
      )}
      <CardMetaRow items={[authorName, readLabel ?? dateLabel]} gap={2} className="mt-3" />
    </Box>
  );
}

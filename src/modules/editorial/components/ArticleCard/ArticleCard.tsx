"use client";

import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { ArticleCardDoc } from "@/lib/content/types";
import { CategoryBadge } from "@/modules/shared/components/CategoryBadge";
import { KiribeImage } from "@/modules/shared/components/media/KiribeImage";
import { KiribeLink, KiribeTypography, publicRoute } from "@/modules/shared/components/ui";
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

const TWO_LINE_CLAMP = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
} as const;

const ONE_LINE_CLAMP = {
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
} as const;

/** Card title — Figma V5: Outfit 16/22, black. */
const cardTitleSx = {
  fontFamily: "var(--font-headline), 'Outfit', sans-serif",
  fontWeight: 400,
  fontSize: "1rem",
  lineHeight: "1.375rem",
  color: "#000",
  transition: "color var(--duration-fast) ease",
} as const;

const metaTextSx = {
  fontSize: "0.75rem",
  lineHeight: "1rem",
  color: "#99A1AF",
  whiteSpace: "nowrap",
} as const;

/** `author · date · read time` row with interpunct separators (Figma V5). */
function CardMetaRow({
  items,
  gap = 1.5,
  sx,
}: {
  items: Array<string | undefined>;
  gap?: number;
  sx?: object;
}) {
  const visible = items.filter((item): item is string => Boolean(item));
  if (visible.length === 0) return null;
  return (
    <Stack direction="row" alignItems="center" spacing={gap} sx={sx}>
      {visible.map((item, i) => (
        <Stack key={`${item}-${i}`} direction="row" alignItems="center" spacing={gap}>
          {i > 0 && <Box component="span" sx={metaTextSx}>·</Box>}
          <Box component="span" sx={metaTextSx}>{item}</Box>
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
    // Figma V5 ListRow — 160×112 thumb, single-line excerpt, chevron affordance.
    return (
      <KiribeLink
        href={href}
        underline="none"
        sx={{
          display: "flex",
          gap: 2.5,
          alignItems: "center",
          px: 1,
          py: 3,
          transition: "background-color var(--duration-fast) ease",
          "&:hover": { bgcolor: "var(--color-surface-alt)" },
          "&:hover .card-title": { color: accent },
          "&:hover .card-chevron": { color: accent, transform: "translateX(2px)" },
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: { xs: 112, sm: 160 },
            height: { xs: 78, sm: 112 },
            flexShrink: 0,
            bgcolor: "#F3F4F6",
          }}
        >
          <KiribeImage
            src={article.heroImage}
            alt={article.heroImage?.alt ?? article.title}
            fill
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {primaryCategory && (
            <Box sx={{ mb: 1 }}>
              <CategoryBadge label={primaryCategory.name} color={accent} variant="solid" />
            </Box>
          )}
          <KiribeTypography
            className="card-title"
            sx={{ ...cardTitleSx, ...TWO_LINE_CLAMP }}
          >
            {article.title}
          </KiribeTypography>
          {article.excerpt && (
            <KiribeTypography
              sx={{
                mt: 0.5,
                color: "#6A7282",
                fontSize: "0.875rem",
                lineHeight: "1.25rem",
                ...ONE_LINE_CLAMP,
              }}
            >
              {article.excerpt}
            </KiribeTypography>
          )}
          <CardMetaRow
            items={[authorName, dateLabel, readLabel]}
            sx={{ mt: 1 }}
          />
        </Box>
        <KeyboardArrowRightIcon
          className="card-chevron"
          sx={{
            display: { xs: "none", sm: "block" },
            fontSize: 20,
            color: "#99A1AF",
            flexShrink: 0,
            transition: "color var(--duration-fast) ease, transform var(--duration-fast) ease",
          }}
        />
      </KiribeLink>
    );
  }

  if (surface === "panel") {
    // Figma V5 related-article card — white panel on gray, badge inside padded body.
    return (
      <KiribeLink
        href={href}
        underline="none"
        sx={{
          display: "block",
          bgcolor: "#fff",
          "&:hover .card-title": { color: accent },
        }}
      >
        <Box sx={{ position: "relative", aspectRatio: "4 / 3", bgcolor: "#F3F4F6" }}>
          <KiribeImage
            src={article.heroImage}
            alt={article.heroImage?.alt ?? article.title}
            fill
          />
        </Box>
        <Box sx={{ p: 2.5 }}>
          {primaryCategory && (
            <CategoryBadge label={primaryCategory.name} color={accent} variant="solid" />
          )}
          <KiribeTypography
            className="card-title"
            sx={{ ...cardTitleSx, mt: 1.5, ...TWO_LINE_CLAMP }}
          >
            {article.title}
          </KiribeTypography>
          <CardMetaRow items={[authorName, readLabel ?? dateLabel]} sx={{ mt: 1 }} />
        </Box>
      </KiribeLink>
    );
  }

  // Figma V5 GridCard — 4:3 image with overlaid badge, two-line excerpt, byline meta.
  return (
    <Box>
      <KiribeLink href={href} underline="none">
        <Box
          sx={{
            position: "relative",
            aspectRatio: "4 / 3",
            bgcolor: "#F3F4F6",
          }}
        >
          <KiribeImage
            src={article.heroImage}
            alt={article.heroImage?.alt ?? article.title}
            fill
          />
          {primaryCategory && (
            <Box sx={{ position: "absolute", top: 12, left: 12 }}>
              <CategoryBadge label={primaryCategory.name} color={accent} variant="solid" />
            </Box>
          )}
        </Box>
      </KiribeLink>
      <KiribeLink href={href} underline="none" sx={{ "&:hover .card-title": { color: accent } }}>
        <KiribeTypography
          className="card-title"
          sx={{ ...cardTitleSx, mt: 2, ...TWO_LINE_CLAMP }}
        >
          {article.title}
        </KiribeTypography>
      </KiribeLink>
      {article.excerpt && (
        <KiribeTypography
          sx={{
            mt: 1,
            color: "#6A7282",
            fontSize: "0.875rem",
            lineHeight: 1.625,
            ...TWO_LINE_CLAMP,
          }}
        >
          {article.excerpt}
        </KiribeTypography>
      )}
      <CardMetaRow
        items={[authorName, readLabel ?? dateLabel]}
        gap={2}
        sx={{ mt: 1.5 }}
      />
    </Box>
  );
}

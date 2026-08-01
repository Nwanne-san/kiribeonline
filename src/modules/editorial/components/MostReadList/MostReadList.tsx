"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { ArticleCardDoc } from "@/lib/content/types";
import {
  EditorialContainer,
  EditorialSection,
  KiribeLink,
  KiribeTypography,
  publicRoute,
} from "@/modules/shared/components/ui";
import { PublicRoutes } from "@/routes/public.routes";
import { CATEGORY_COLORS } from "@/theme/category-colors";
import { ArticleByline } from "../ArticleByline";

type MostReadVariant = "homepage" | "sidebar";

type MostReadListProps = {
  articles: ArticleCardDoc[];
  /** `homepage` renders a full section band; `sidebar` renders a compact panel. */
  variant?: MostReadVariant;
  /** Section title override. Defaults to "Most Read". */
  title?: string;
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

/** Big Outfit numerals — burgundy, thin. Distinctive "top-5" leaderboard feel. */
const numeralBaseSx = {
  fontFamily: "var(--font-headline), 'Outfit', sans-serif",
  fontWeight: 300,
  color: "primary.main",
  lineHeight: 0.9,
  flexShrink: 0,
  fontVariantNumeric: "tabular-nums",
} as const;

function MostReadRow({
  index,
  article,
  variant,
}: {
  index: number;
  article: ArticleCardDoc;
  variant: MostReadVariant;
}) {
  const href = publicRoute(PublicRoutes.articleDetail, { slug: article.slug });
  const category = article.categories?.[0];
  const accent = categoryAccent(category?.slug);
  const label = String(index + 1).padStart(2, "0");

  const numeralSx =
    variant === "homepage"
      ? { ...numeralBaseSx, fontSize: { xs: "2.5rem", md: "3rem" } }
      : { ...numeralBaseSx, fontSize: "2rem" };

  return (
    <KiribeLink
      href={href}
      underline="none"
      color="inherit"
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: variant === "homepage" ? 2.5 : 2,
        py: variant === "homepage" ? 2 : 1.75,
        transition: "color var(--duration-fast) ease",
        "&:hover .most-read-title": { color: accent },
      }}
    >
      <Box
        component="span"
        aria-hidden="true"
        sx={{ ...numeralSx, opacity: 0.85, minWidth: variant === "homepage" ? 56 : 44 }}
      >
        {label}
      </Box>
      <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
        {category && (
          <KiribeTypography
            variant="kicker"
            sx={{
              color: categoryAccent(category.slug),
              display: "block",
              fontSize: "0.6875rem",
              letterSpacing: "0.1em",
            }}
          >
            {category.name}
          </KiribeTypography>
        )}
        <KiribeTypography
          className="most-read-title"
          sx={{
            fontFamily: "var(--font-headline), 'Outfit', sans-serif",
            fontWeight: 500,
            fontSize: variant === "homepage" ? "1.0625rem" : "0.9375rem",
            lineHeight: 1.35,
            color: "text.primary",
            transition: "color var(--duration-fast) ease",
            ...TWO_LINE_CLAMP,
          }}
        >
          {article.title}
        </KiribeTypography>
        <ArticleByline article={article} sx={{ pt: 0.25 }} />
      </Stack>
    </KiribeLink>
  );
}

/**
 * "Most Read" editorial leaderboard — numbered list (01–NN) with big serif-ish
 * numerals in Outfit, category kicker, and title. Two variants:
 *
 * - `homepage`: full section band, 5 items split across a 2-col grid on desktop.
 * - `sidebar`: compact vertical list for the article detail rail.
 *
 * Silently renders nothing when the input is empty so admins never see a
 * dangling section header on a fresh site.
 */
export function MostReadList({
  articles,
  variant = "homepage",
  title = "Most Read",
}: MostReadListProps) {
  if (!articles.length) return null;

  if (variant === "sidebar") {
    return (
      <Box
        component="aside"
        aria-label={title}
        sx={{
          bgcolor: "#F9FAFB",
          border: "1px solid",
          borderColor: "divider",
          p: 3,
        }}
      >
        <KiribeTypography
          variant="h3"
          sx={{
            color: "primary.main",
            fontSize: "1rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {title}
        </KiribeTypography>
        <Box sx={{ width: 40, height: 2, bgcolor: "secondary.main", mt: 1, mb: 2 }} />
        <Stack divider={<Box sx={{ height: "1px", bgcolor: "divider" }} />}>
          {articles.map((article, i) => (
            <MostReadRow key={article.id} index={i} article={article} variant="sidebar" />
          ))}
        </Stack>
      </Box>
    );
  }

  // Homepage: split the list across two columns on desktop, single column on mobile
  return (
    <EditorialSection sx={{ py: { xs: 5, md: 8 }, bgcolor: "background.paper" }}>
      <EditorialContainer>
        <Stack direction="row" alignItems="baseline" spacing={2} sx={{ mb: 3 }}>
          <Box>
            <KiribeTypography
              variant="h3"
              color="primary.main"
              sx={{ textTransform: "uppercase" }}
            >
              {title}
            </KiribeTypography>
            <Box sx={{ width: 48, height: 3, bgcolor: "secondary.main", mt: 0.75 }} />
          </Box>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 0, md: 4 },
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          {articles.map((article, i) => (
            <Box
              key={article.id}
              sx={{
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <MostReadRow index={i} article={article} variant="homepage" />
            </Box>
          ))}
        </Box>
      </EditorialContainer>
    </EditorialSection>
  );
}

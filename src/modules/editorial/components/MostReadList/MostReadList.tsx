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
import { cn } from "@/modules/shared/components/tw";
import { PublicRoutes } from "@/routes/public.routes";
import { CATEGORY_COLORS } from "@/theme/category-colors";

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

const numeralBaseClass =
  "font-headline font-light text-burgundy leading-[0.9] shrink-0 tabular-nums opacity-85";

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
  const isHomepage = variant === "homepage";

  return (
    <KiribeLink
      href={href}
      underline="none"
      color="inherit"
      className={cn(
        "flex items-start transition-colors duration-[var(--duration-fast)] ease-in-out group",
        isHomepage ? "gap-5 py-4" : "gap-4 py-3.5"
      )}
      style={{ ["--most-read-accent" as string]: accent }}
    >
      <Box
        component="span"
        aria-hidden="true"
        className={cn(
          numeralBaseClass,
          isHomepage ? "text-[2.5rem] md:text-5xl min-w-14" : "text-[2rem] min-w-11"
        )}
      >
        {label}
      </Box>
      <Stack spacing={0.5} className="min-w-0 flex-1">
        {category && (
          <KiribeTypography
            variant="kicker"
            className="block text-[0.6875rem] tracking-[0.1em]"
            style={{ color: categoryAccent(category.slug) }}
          >
            {category.name}
          </KiribeTypography>
        )}
        <KiribeTypography
          className={cn(
            "most-read-title font-headline font-medium leading-[1.35] text-ink transition-colors duration-[var(--duration-fast)] ease-in-out line-clamp-2 group-hover:text-[var(--most-read-accent)]",
            isHomepage ? "text-[1.0625rem]" : "text-[0.9375rem]"
          )}
        >
          {article.title}
        </KiribeTypography>
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
        className="bg-surface-alt border border-border p-6"
      >
        <KiribeTypography
          variant="h3"
          className="text-burgundy text-base tracking-[0.08em] uppercase font-semibold"
        >
          {title}
        </KiribeTypography>
        <Box className="w-10 h-0.5 bg-mustard mt-2 mb-4" />
        <Stack divider={<Box className="h-px bg-border" />}>
          {articles.map((article, i) => (
            <MostReadRow key={article.id} index={i} article={article} variant="sidebar" />
          ))}
        </Stack>
      </Box>
    );
  }

  // Homepage: split the list across two columns on desktop, single column on mobile
  return (
    <EditorialSection className="py-10 md:py-16 bg-surface">
      <EditorialContainer>
        <Stack direction="row" alignItems="baseline" spacing={2} className="mb-6">
          <Box>
            <KiribeTypography
              variant="h3"
              color="primary.main"
              className="uppercase"
            >
              {title}
            </KiribeTypography>
            <Box className="w-12 h-[3px] bg-mustard mt-1.5" />
          </Box>
        </Stack>

        <Box className="grid gap-0 md:gap-8 grid-cols-1 md:grid-cols-2 border-t border-border">
          {articles.map((article, i) => (
            <Box
              key={article.id}
              className="border-b border-border"
            >
              <MostReadRow index={i} article={article} variant="homepage" />
            </Box>
          ))}
        </Box>
      </EditorialContainer>
    </EditorialSection>
  );
}

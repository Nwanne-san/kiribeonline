import NextLink from "next/link";
import type { PublicCategorySummary } from "@/lib/content";
import { EmptyState } from "@/modules/shared/components/feedback/EmptyState";
import { EmptyShelfIllustration } from "@/modules/shared/components/illustrations";
import { publicRoute } from "@/modules/shared/components/ui";
import {
  Container,
  GoldRule,
  Heading,
  Kicker,
  Section,
  cn,
} from "@/modules/shared/components/tw";
import { PublicRoutes } from "@/routes/public.routes";
import { CATEGORY_COLORS, type CategorySlug } from "@/theme/category-colors";

/** Fallback accent when a category has no stored brand colour or theme accent. */
const DEFAULT_ACCENT = "#6b1d2a";

function resolveAccent(category: PublicCategorySummary): string {
  if (category.brandColor) return category.brandColor;
  const themed = CATEGORY_COLORS[category.slug as CategorySlug];
  return themed?.bg ?? DEFAULT_ACCENT;
}

function CategoryCard({ category }: { category: PublicCategorySummary }) {
  const accent = resolveAccent(category);
  const href = publicRoute(PublicRoutes.categoryDetail, { slug: category.slug });
  const countLabel = `${category.articleCount} ${
    category.articleCount === 1 ? "story" : "stories"
  }`;

  return (
    <NextLink
      href={href}
      className={cn(
        "group flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-surface",
        "transition-shadow hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy focus-visible:ring-offset-2"
      )}
    >
      {/* Accent bar uses the CMS brand colour — a dynamic hex with no token. */}
      <div
        className="h-1.5 w-full shrink-0"
        style={{ backgroundColor: accent }}
        aria-hidden="true"
      />
      <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <Heading
            variant="h4"
            as="h3"
            className="capitalize transition-colors group-hover:text-burgundy"
          >
            {category.name}
          </Heading>
          <span className="mt-1 shrink-0 font-body text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            {countLabel}
          </span>
        </div>

        {category.description && (
          <p className="font-body text-sm leading-relaxed text-muted line-clamp-2">
            {category.description}
          </p>
        )}

        {category.latestArticleTitle && (
          <div className="mt-auto pt-2">
            <span className="mb-0.5 block font-body text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-soft">
              Latest
            </span>
            <span className="block truncate font-body text-sm text-ink transition-colors group-hover:text-burgundy">
              {category.latestArticleTitle}
            </span>
          </div>
        )}
      </div>
    </NextLink>
  );
}

type CategoriesPageProps = {
  categories: PublicCategorySummary[];
};

export function CategoriesPage({ categories }: CategoriesPageProps) {
  return (
    <Section>
      <Container>
        <header className="mb-8 md:mb-12">
          <Kicker>Browse</Kicker>
          <Heading variant="h1" className="mt-2">
            Categories
          </Heading>
          <GoldRule className="mt-3" />
          <p className="mt-4 max-w-2xl font-body text-base leading-relaxed text-muted">
            Explore Kiribé Online by subject — from film and television criticism
            to opinion, news, and creator spotlights.
          </p>
        </header>

        {categories.length === 0 ? (
          <EmptyState
            illustration={<EmptyShelfIllustration />}
            title="No categories yet"
            description="Categories will appear here once the editorial desk sets them up. In the meantime, browse the full archive."
            action={{ label: "Browse all articles", href: PublicRoutes.articles }}
          />
        ) : (
          <ul className="grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-2 base:grid-cols-3">
            {categories.map((category) => (
              <li key={category.id} className="flex">
                <CategoryCard category={category} />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </Section>
  );
}

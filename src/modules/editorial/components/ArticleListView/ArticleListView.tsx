"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import {
  ArticleCard,
  CategoryHero,
  FeaturedArticleCard,
  InfiniteArticleList,
} from "@/modules/editorial/components";
import { useArticlesList } from "@/modules/editorial/hooks/useArticlesList";
import {
  ArticleCardGridSkeleton,
  ArticleCardListSkeleton,
} from "@/modules/shared/components/skeleton";
import { DataRenderer, EmptyState } from "@/modules/shared/components/feedback";
import {
  CategoryEmptyIllustration,
  NoResultsIllustration,
} from "@/modules/shared/components/illustrations";
import CloseIcon from "@mui/icons-material/Close";
import {
  EditorialContainer,
  KiribeLink,
  KiribePaginationControls,
  KiribeTypography,
} from "@/modules/shared/components/ui";
import { cn } from "@/modules/shared/components/tw";
import { useListViewMode } from "@/utils/hooks";
import { MIN_SEARCH_LENGTH, type ListViewMode } from "@/constants";
import { PublicRoutes } from "@/routes/public.routes";

export type ArticleListViewProps = {
  mode?: "archive" | "search";
  defaultCategorySlug?: string;
  defaultTagSlug?: string;
  /** Section heading above the grid, e.g. "All News Articles". */
  sectionTitle?: string;
  /** Feature the first article as a split hero card (category / archive front pages). */
  featured?: boolean;
  hero?: {
    kicker?: string;
    title: string;
    description?: string;
    /** Accent colour for the category badge + hero wash. */
    accentColor?: string;
    /** Category label shown as a solid badge (e.g. "NEWS"). */
    accentLabel?: string;
    /** Optional background image URL. */
    image?: string;
  };
  emptyTitle?: string;
  emptyDescription?: string;
  /**
   * Optional "filtered by" affordance for URL-driven filters (e.g. tag from an
   * article's tag chip). When set, renders a dismissible indicator whose clear
   * control links back to `clearHref`. Omit on pages where the filter *is* the
   * page (category archives) so no redundant chip appears.
   */
  activeFilter?: { label: string; clearHref: string };
};

/**
 * GRID / LIST / FEED toggle — sharp-edged, burgundy active state (Figma V5).
 * Feed mode drops pagination in favour of infinite scroll, useful for casual
 * browsing sessions.
 */
function ViewToggle({
  view,
  onChange,
}: {
  view: ListViewMode;
  onChange: (view: ListViewMode) => void;
}) {
  const options: { value: ListViewMode; label: string; ariaLabel: string }[] = [
    { value: "grid", label: "Grid", ariaLabel: "Grid view" },
    { value: "list", label: "List", ariaLabel: "List view" },
    { value: "feed", label: "Feed", ariaLabel: "Feed view (infinite scroll)" },
  ];
  return (
    <Box
      role="group"
      aria-label="Article view mode"
      className="inline-flex items-center gap-1 p-0.5 border border-border"
    >
      {options.map((opt) => {
        const active = view === opt.value;
        return (
          <Box
            key={opt.value}
            component="button"
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            aria-label={opt.ariaLabel}
            className={cn(
              "px-3 py-1.5 cursor-pointer border-none font-headline text-xs leading-4 tracking-wide uppercase transition-colors duration-[var(--duration-fast)] ease-in-out",
              active
                ? "bg-burgundy text-white hover:bg-burgundy"
                : "bg-transparent text-muted hover:bg-surface-alt"
            )}
          >
            {opt.label}
          </Box>
        );
      })}
    </Box>
  );
}

export function ArticleListView({
  mode = "archive",
  defaultCategorySlug,
  defaultTagSlug,
  sectionTitle,
  featured = false,
  hero,
  emptyTitle = "No articles yet",
  emptyDescription = "Published stories will appear here once the editor publishes content.",
  activeFilter,
}: ArticleListViewProps) {
  const { setView } = useListViewMode();
  const {
    articles,
    view,
    q,
    pagination,
    page,
    limit,
    setPage,
    setLimit,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    searchEnabled,
    isSearchMode,
  } = useArticlesList({ mode, defaultCategorySlug, defaultTagSlug });

  // In search mode, prompt for input whenever the query is too short — including
  // an empty query (e.g. landing on /search with no `q`), so the page never
  // renders an empty "0 articles" grid as a dead end.
  const showSearchPrompt = isSearchMode && q.trim().length < MIN_SEARCH_LENGTH;

  const isFiltered =
    isSearchMode || Boolean(defaultCategorySlug) || Boolean(defaultTagSlug);

  const accent = hero?.accentColor ?? "#7F0400";
  const heading = sectionTitle ?? (hero ? `All ${hero.title} Articles` : "All Articles");

  return (
    <Box className="pb-20">
      {hero && (
        <CategoryHero
          title={hero.title}
          description={hero.description}
          accentColor={accent}
          accentLabel={hero.accentLabel}
          kicker={hero.kicker}
          image={hero.image}
        />
      )}

      <EditorialContainer className="py-12 md:py-16">
        {activeFilter && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            className="inline-flex mb-8 pl-3 pr-1 py-1 border border-burgundy bg-surface-alt"
          >
            <KiribeTypography
              component="span"
              className="font-headline text-xs tracking-[0.05em] uppercase text-burgundy"
            >
              Filtered by {activeFilter.label}
            </KiribeTypography>
            <KiribeLink
              href={activeFilter.clearHref}
              underline="none"
              aria-label="Clear filter and browse all articles"
              className="inline-flex items-center justify-center p-1 text-burgundy hover:text-mustard"
            >
              <CloseIcon className="text-[1rem]" />
            </KiribeLink>
          </Stack>
        )}
        {showSearchPrompt ? (
          <EmptyState
            illustration={<NoResultsIllustration />}
            title="Keep typing"
            description={`Enter at least ${MIN_SEARCH_LENGTH} characters to search.`}
          />
        ) : (
          <DataRenderer
            isLoading={isLoading}
            isError={isError}
            isEmpty={!isLoading && searchEnabled && articles.length === 0}
            showRetry={isError}
            onRetry={() => refetch()}
            renderLoading={
              <Grid container spacing={4}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Grid key={i} size={{ xs: 12, md: 6, base: 4 }}>
                    {view === "list" ? <ArticleCardListSkeleton /> : <ArticleCardGridSkeleton />}
                  </Grid>
                ))}
              </Grid>
            }
            renderEmpty={
              <EmptyState
                illustration={
                  isSearchMode ? (
                    <NoResultsIllustration />
                  ) : (
                    // Themed per category (film reel, TV set, …); archives
                    // without a category fall back to the generic shelf.
                    <CategoryEmptyIllustration slug={defaultCategorySlug} />
                  )
                }
                title={
                  isSearchMode && q.trim().length >= MIN_SEARCH_LENGTH
                    ? `No stories match "${q.trim()}"`
                    : emptyTitle
                }
                description={
                  isSearchMode
                    ? "Try a different title or browse the full archive."
                    : emptyDescription
                }
                action={
                  isFiltered
                    ? { label: "Browse all articles", href: PublicRoutes.articles }
                    : undefined
                }
              />
            }
          >
            {() => {
              const showFeatured =
                featured &&
                !isSearchMode &&
                page === 1 &&
                view !== "feed" &&
                articles.length > 0;
              // The featured card is a highlight, not a replacement — the
              // "All … Articles" grid/list below still shows every article
              // (otherwise a one-article category renders an empty list).
              const featuredArticle = showFeatured ? articles[0] : undefined;
              const listArticles = articles;

              return (
                <>
                  {featuredArticle && (
                    <Box className="mb-12 md:mb-16">
                      <KiribeTypography
                        variant="kicker"
                        color="secondary.main"
                        className="block mb-4"
                      >
                        Featured
                      </KiribeTypography>
                      <FeaturedArticleCard article={featuredArticle} />
                    </Box>
                  )}

                  {/* Section header + view toggle */}
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ sm: "center" }}
                    spacing={2}
                    className="pb-6 mb-8 border-b border-border"
                  >
                    <Box>
                      <KiribeTypography className="font-headline font-normal text-xl leading-[1.4] tracking-wide text-burgundy">
                        {heading}
                      </KiribeTypography>
                      <Box className="mt-2 w-8 h-0.5 bg-mustard" />
                      {typeof pagination.totalDocs === "number" && (
                        <KiribeTypography className="mt-3 text-sm text-muted">
                          {pagination.totalDocs} {pagination.totalDocs === 1 ? "article" : "articles"}
                        </KiribeTypography>
                      )}
                    </Box>
                    <ViewToggle view={view} onChange={setView} />
                  </Stack>

                  {view === "feed" ? (
                    <InfiniteArticleList
                      articles={articles}
                      view={view}
                      hasNextPage={hasNextPage}
                      isFetchingNextPage={isFetchingNextPage}
                      fetchNextPage={fetchNextPage}
                    />
                  ) : view === "list" ? (
                    <Stack spacing={1}>
                      {listArticles.map((article) => (
                        <ArticleCard key={article.id} article={article} variant="list" />
                      ))}
                    </Stack>
                  ) : (
                    <Grid container spacing={4}>
                      {listArticles.map((article) => (
                        <Grid key={article.id} size={{ xs: 12, md: 6, base: 4 }}>
                          <ArticleCard article={article} variant="grid" />
                        </Grid>
                      ))}
                    </Grid>
                  )}

                  {view !== "feed" && (
                    <KiribePaginationControls
                      currentPage={page}
                      rowsPerPage={limit}
                      totalItems={pagination.totalDocs}
                      onPageChange={({ page: nextPage, rowsPerPage }) => {
                        // KiribePaginationControls fires this callback for both
                        // page-changes and page-size changes with the same
                        // shape. `setLimit` resets the page to 1 by design, so
                        // calling both unconditionally clobbers the setPage URL
                        // write on the Next/Prev clicks — split the branches.
                        if (rowsPerPage !== limit) {
                          setLimit(rowsPerPage);
                        } else {
                          setPage(nextPage);
                        }
                      }}
                      isCondense
                      itemLabel="Stories per page"
                    />
                  )}
                </>
              );
            }}
          </DataRenderer>
        )}
      </EditorialContainer>
    </Box>
  );
}

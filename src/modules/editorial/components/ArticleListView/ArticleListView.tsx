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
  EmptyShelfIllustration,
  NoResultsIllustration,
} from "@/modules/shared/components/illustrations";
import CloseIcon from "@mui/icons-material/Close";
import {
  EditorialContainer,
  KiribeLink,
  KiribePaginationControls,
  KiribeTypography,
} from "@/modules/shared/components/ui";
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
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        p: 0.25,
        border: "1px solid #E5E7EB",
      }}
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
            sx={{
              px: 1.5,
              py: 0.75,
              cursor: "pointer",
              border: "none",
              fontFamily: "var(--font-headline), 'Outfit', sans-serif",
              fontSize: "0.75rem",
              lineHeight: "1rem",
              letterSpacing: "0.025em",
              textTransform: "uppercase",
              bgcolor: active ? "primary.main" : "transparent",
              color: active ? "common.white" : "#6A7282",
              transition: "background-color var(--duration-fast) ease",
              "&:hover": { bgcolor: active ? "primary.main" : "var(--color-surface-alt)" },
            }}
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
    <Box sx={{ pb: 10 }}>
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

      <EditorialContainer sx={{ py: { xs: 6, md: 8 } }}>
        {activeFilter && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              display: "inline-flex",
              mb: 4,
              pl: 1.5,
              pr: 0.5,
              py: 0.5,
              border: "1px solid",
              borderColor: "primary.main",
              bgcolor: "var(--color-surface-alt)",
            }}
          >
            <KiribeTypography
              component="span"
              sx={{
                fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                fontSize: "0.75rem",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "primary.main",
              }}
            >
              Filtered by {activeFilter.label}
            </KiribeTypography>
            <KiribeLink
              href={activeFilter.clearHref}
              underline="none"
              aria-label="Clear filter and browse all articles"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                p: 0.5,
                color: "primary.main",
                "&:hover": { color: "secondary.main" },
              }}
            >
              <CloseIcon sx={{ fontSize: "1rem" }} />
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
                  <Grid key={i} size={{ xs: 12, sm: 6, lg: 4 }}>
                    {view === "list" ? <ArticleCardListSkeleton /> : <ArticleCardGridSkeleton />}
                  </Grid>
                ))}
              </Grid>
            }
            renderEmpty={
              <EmptyState
                illustration={
                  isSearchMode ? <NoResultsIllustration /> : <EmptyShelfIllustration />
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
              const featuredArticle = showFeatured ? articles[0] : undefined;
              const listArticles = showFeatured ? articles.slice(1) : articles;

              return (
                <>
                  {featuredArticle && (
                    <Box sx={{ mb: { xs: 6, md: 8 } }}>
                      <KiribeTypography
                        variant="kicker"
                        color="secondary.main"
                        sx={{ display: "block", mb: 2 }}
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
                    sx={{ pb: 3, mb: 4, borderBottom: "1px solid", borderColor: "divider" }}
                  >
                    <Box>
                      <KiribeTypography
                        sx={{
                          fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                          fontWeight: 400,
                          fontSize: "1.25rem",
                          lineHeight: 1.4,
                          letterSpacing: "0.025em",
                          color: "primary.main",
                        }}
                      >
                        {heading}
                      </KiribeTypography>
                      <Box sx={{ mt: 1, width: 32, height: 2, bgcolor: "secondary.main" }} />
                      {typeof pagination.totalDocs === "number" && (
                        <KiribeTypography sx={{ mt: 1.5, fontSize: "0.875rem", color: "#6A7282" }}>
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
                        <Grid key={article.id} size={{ xs: 12, sm: 6, lg: 4 }}>
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
                        setPage(nextPage);
                        setLimit(rowsPerPage);
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

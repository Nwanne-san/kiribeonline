"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import {
  ArchiveToolbar,
  ArticleCard,
  InfiniteArticleList,
} from "@/modules/editorial/components";
import { CategoryFilterBar } from "@/modules/shared/components/CategoryFilterBar";
import { useArticlesList } from "@/modules/editorial/hooks/useArticlesList";
import {
  ArchiveToolbarSkeleton,
  ArticleCardGridSkeleton,
  ArticleCardListSkeleton,
} from "@/modules/shared/components/skeleton";
import {
  DataRenderer,
  EmptyState,
} from "@/modules/shared/components/feedback";
import {
  EmptyShelfIllustration,
  NoResultsIllustration,
} from "@/modules/shared/components/illustrations";
import {
  EditorialContainer,
  KiribePaginationControls,
  KiribeTypography,
} from "@/modules/shared/components/ui";
import { useListViewMode } from "@/utils/hooks";
import { MIN_SEARCH_LENGTH } from "@/constants";
import { PublicRoutes } from "@/routes/public.routes";

export type ArticleListViewProps = {
  mode?: "archive" | "search";
  defaultCategorySlug?: string;
  defaultTagSlug?: string;
  hero?: {
    kicker?: string;
    title: string;
    description?: string;
  };
  emptyTitle?: string;
  emptyDescription?: string;
};

export function ArticleListView({
  mode = "archive",
  defaultCategorySlug,
  defaultTagSlug,
  hero,
  emptyTitle = "No articles yet",
  emptyDescription = "Published stories will appear here once the editor publishes content.",
}: ArticleListViewProps) {
  const { setView } = useListViewMode();
  const {
    articles,
    view,
    searchValue,
    setSearchValue,
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

  const showSearchPrompt =
    isSearchMode && q.trim().length > 0 && q.trim().length < MIN_SEARCH_LENGTH;

  const isFiltered =
    isSearchMode || Boolean(defaultCategorySlug) || Boolean(defaultTagSlug);

  return (
    <Box sx={{ pb: 8 }}>
      {hero && (
        <Box
          component="section"
          sx={{
            bgcolor: "archiveHero.main",
            color: "common.white",
            px: 2,
            py: { xs: 8, md: 10 },
            textAlign: "center",
          }}
        >
          {hero.kicker && (
            <KiribeTypography variant="kicker" color="secondary.main">
              {hero.kicker}
            </KiribeTypography>
          )}
          <KiribeTypography variant="h1" sx={{ mt: hero.kicker ? 2 : 0, fontSize: { xs: "2.25rem", md: "3rem" } }}>
            {hero.title}
          </KiribeTypography>
          {hero.description && (
            <KiribeTypography
              variant="body1"
              sx={{ mt: 2, mx: "auto", maxWidth: 640, color: "rgba(255,255,255,0.8)" }}
            >
              {hero.description}
            </KiribeTypography>
          )}
        </Box>
      )}

      <EditorialContainer sx={{ py: 4 }}>
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
              <>
                <ArchiveToolbarSkeleton />
                {view === "grid" ? (
                  <Grid container spacing={4} sx={{ mt: 2 }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Grid key={i} size={{ xs: 12, sm: 6, lg: 4 }}>
                        <ArticleCardGridSkeleton />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ mt: 2 }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <ArticleCardListSkeleton key={i} />
                    ))}
                  </Box>
                )}
              </>
            }
            renderEmpty={
              <EmptyState
                illustration={
                  isSearchMode ? (
                    <NoResultsIllustration />
                  ) : (
                    <EmptyShelfIllustration />
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
            {() => (
              <>
                <ArchiveToolbar
                  searchValue={searchValue}
                  onSearchChange={setSearchValue}
                  view={view}
                  onViewChange={setView}
                  totalDocs={pagination.totalDocs}
                />
                {mode === "archive" && <CategoryFilterBar />}

                {view === "feed" ? (
                  <InfiniteArticleList
                    articles={articles}
                    view={view}
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    fetchNextPage={fetchNextPage}
                  />
                ) : view === "grid" ? (
                  <Grid container spacing={4}>
                    {articles.map((article) => (
                      <Grid key={article.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                        <ArticleCard article={article} variant="grid" />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Stack spacing={0}>
                    {articles.map((article) => (
                      <ArticleCard key={article.id} article={article} variant="list" />
                    ))}
                  </Stack>
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
                  />
                )}
              </>
            )}
          </DataRenderer>
        )}
      </EditorialContainer>
    </Box>
  );
}

"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import { useEffect, useRef } from "react";
import type { ArticleCardDoc } from "@/lib/content/types";
import { ArticleCard } from "../ArticleCard";
import { KiribeButton } from "@/modules/shared/components/ui";

export type InfiniteArticleListProps = {
  articles: ArticleCardDoc[];
  view: "grid" | "list" | "feed";
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
};

export function InfiniteArticleList({
  articles,
  view,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: InfiniteArticleListProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage || !fetchNextPage) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const content =
    view === "list" || view === "feed" ? (
      <Stack spacing={0}>
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} variant="list" />
        ))}
      </Stack>
    ) : (
      <Grid container spacing={4}>
        {articles.map((article) => (
          <Grid key={article.id} size={{ xs: 12, md: 6, base: 4 }}>
            <ArticleCard article={article} variant="grid" />
          </Grid>
        ))}
      </Grid>
    );

  return (
    <Box>
      {content}
      {hasNextPage && (
        <Box ref={sentinelRef} className="py-8 text-center">
          <KiribeButton
            variant="outlined"
            onClick={() => fetchNextPage?.()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </KiribeButton>
        </Box>
      )}
    </Box>
  );
}

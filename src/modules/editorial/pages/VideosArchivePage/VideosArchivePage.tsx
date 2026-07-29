"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import type { PublicReel } from "@/lib/content/query-homepage";
import { CategoryHero } from "@/modules/editorial/components/CategoryHero";
import { useReelModal } from "@/modules/editorial/hooks/useReelModal";
import { VideoModal } from "@/modules/editorial/components/VideoModal";
import { VideoReelCard } from "@/modules/editorial/components/VideoReelCard";
import { EmptyState } from "@/modules/shared/components/feedback";
import { EditorialContainer, KiribeTypography } from "@/modules/shared/components/ui";
import { CATEGORY_COLORS } from "@/theme/category-colors";

type VideosArchivePageProps = {
  reels: PublicReel[];
};

const ACCENT = CATEGORY_COLORS.videos?.bg ?? "#6B1D2A";

/**
 * `/categories/videos` renders reels (the video content type), not articles.
 * Special-cased in `src/app/(site)/categories/[slug]/page.tsx` — the generic
 * archive expects articles-tagged-with-category, which was always empty for
 * Videos because reels live in a separate collection.
 */
export function VideosArchivePage({ reels }: VideosArchivePageProps) {
  // URL-driven (`?modal=video&reel=<id>`) so an open video is linkable and
  // closes with the browser Back button.
  const { activeReel, open: openReel, close: closeReel } = useReelModal(reels);

  return (
    <Box sx={{ pb: 10 }}>
      <CategoryHero
        title="Videos"
        description="Short-form reels, interviews, and visual features from Kiribé — pulled directly from our socials."
        accentColor={ACCENT}
        accentLabel="Videos"
        kicker="Kiribé Video Desk"
      />

      <EditorialContainer sx={{ py: { xs: 6, md: 8 } }}>
        {reels.length === 0 ? (
          <EmptyState
            title="No videos yet"
            description="We publish new reels and shorts here. Check back soon."
          />
        ) : (
          <>
            <Box sx={{ mb: { xs: 3, md: 4 } }}>
              <KiribeTypography
                variant="h3"
                sx={{
                  color: "primary.main",
                  fontSize: { xs: "1.25rem", md: "1.5rem" },
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                All Videos
              </KiribeTypography>
              <Box sx={{ mt: 1, width: 32, height: 2, bgcolor: "secondary.main" }} />
              <KiribeTypography sx={{ mt: 1.5, fontSize: "0.875rem", color: "#6A7282" }}>
                {reels.length} {reels.length === 1 ? "video" : "videos"}
              </KiribeTypography>
            </Box>

            <Grid container spacing={{ xs: 2, md: 3 }}>
              {reels.map((reel) => (
                <Grid key={reel.id} size={{ xs: 6, sm: 4, md: 3 }}>
                  <VideoReelCard reel={reel} onSelect={openReel} size="grid" />
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </EditorialContainer>

      <VideoModal reel={activeReel} onClose={closeReel} />
    </Box>
  );
}

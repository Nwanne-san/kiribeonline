"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import NextLink from "next/link";
import { useState } from "react";
import type { PublicReel } from "@/lib/content/query-homepage";
import { VideoModal } from "@/modules/editorial/components/VideoModal";
import { VideoReelCard } from "@/modules/editorial/components/VideoReelCard";
import {
  EditorialContainer,
  EditorialSection,
  KiribeButton,
  KiribeTypography,
} from "@/modules/shared/components/ui";
import { PublicRoutes } from "@/routes/public.routes";

type ReelsSectionProps = {
  reels: PublicReel[];
};

export function ReelsSection({ reels }: ReelsSectionProps) {
  const hasReels = reels.length > 0;
  const [activeReel, setActiveReel] = useState<PublicReel | null>(null);

  return (
    <EditorialSection sx={{ bgcolor: "#F9FAFB", py: { xs: 6, md: 8 } }}>
      <EditorialContainer>
        <Stack alignItems="center" spacing={1} sx={{ mb: { xs: 3, md: 4 }, textAlign: "center" }}>
          <KiribeTypography
            variant="h3"
            sx={{
              color: "primary.main",
              fontSize: { xs: "1.5rem", md: "1.75rem" },
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Reels &amp; Shorts
          </KiribeTypography>
          <Box sx={{ width: 48, height: 2, bgcolor: "secondary.main" }} />
          <KiribeTypography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            From our social channels
          </KiribeTypography>
        </Stack>

        {hasReels ? (
          <Box
            sx={{
              display: "flex",
              gap: 2,
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              pb: 2,
              mx: { xs: -2, md: 0 },
              px: { xs: 2, md: 0 },
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {reels.map((reel) => (
              <Box key={reel.id} sx={{ flex: "0 0 auto", scrollSnapAlign: "start" }}>
                <VideoReelCard reel={reel} onSelect={setActiveReel} />
              </Box>
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              py: { xs: 4, md: 6 },
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 1,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            <KiribeTypography variant="body2" sx={{ color: "inherit" }}>
              Latest reels from our socials will appear here.
            </KiribeTypography>
          </Box>
        )}

        <Stack alignItems="center" sx={{ mt: { xs: 3, md: 4 } }}>
          <KiribeButton
            component={NextLink}
            href={PublicRoutes.categoryVideos}
            sx={{ px: 4, py: 1.25, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            Watch More Videos
          </KiribeButton>
        </Stack>
      </EditorialContainer>

      <VideoModal reel={activeReel} onClose={() => setActiveReel(null)} />
    </EditorialSection>
  );
}

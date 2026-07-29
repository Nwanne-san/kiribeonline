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
    <EditorialSection className="bg-surface-alt py-12 md:py-16">
      <EditorialContainer>
        <Stack alignItems="center" spacing={1} className="mb-6 md:mb-8 text-center">
          <KiribeTypography
            variant="h3"
            className="text-burgundy text-2xl md:text-[1.75rem] tracking-[0.04em] uppercase"
          >
            Reels &amp; Shorts
          </KiribeTypography>
          <Box className="w-12 h-0.5 bg-mustard" />
          <KiribeTypography variant="body2" color="text.secondary" className="mt-2">
            From our social channels
          </KiribeTypography>
        </Stack>

        {hasReels ? (
          <Box className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 md:mx-0 px-4 md:px-0 hide-scrollbar">
            {reels.map((reel) => (
              <Box key={reel.id} className="shrink-0 snap-start">
                <VideoReelCard reel={reel} onSelect={setActiveReel} />
              </Box>
            ))}
          </Box>
        ) : (
          <Box className="py-8 md:py-12 border border-dashed border-border rounded text-center text-ink-secondary">
            <KiribeTypography variant="body2" className="text-inherit">
              Latest reels from our socials will appear here.
            </KiribeTypography>
          </Box>
        )}

        <Stack alignItems="center" className="mt-6 md:mt-8">
          <KiribeButton
            component={NextLink}
            href={PublicRoutes.categoryVideos}
            className="px-8 py-2.5 text-xs tracking-[0.08em] uppercase"
          >
            Watch More Videos
          </KiribeButton>
        </Stack>
      </EditorialContainer>

      <VideoModal reel={activeReel} onClose={() => setActiveReel(null)} />
    </EditorialSection>
  );
}

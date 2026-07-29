"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import StarIcon from "@mui/icons-material/Star";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import type { PublicCreator } from "@/lib/content/query-homepage";
import { CategoryHero } from "@/modules/editorial/components";
import { EmptyState } from "@/modules/shared/components/feedback";
import { SpotlightLampIllustration } from "@/modules/shared/components/illustrations";
import { KiribeImage } from "@/modules/shared/components/media/KiribeImage";
import {
  EditorialContainer,
  KiribeLink,
  KiribeTypography,
} from "@/modules/shared/components/ui";
import { PublicRoutes } from "@/routes/public.routes";
import { CATEGORY_COLORS } from "@/theme/category-colors";

type SpotlightArchivePageProps = {
  featuredCreator: PublicCreator | null;
  moreCreators: PublicCreator[];
};

const SPOTLIGHT_ACCENT = CATEGORY_COLORS.spotlight.bg;

const ACHIEVEMENT_ICONS = {
  award: EmojiEventsIcon,
  star: StarIcon,
  trending: TrendingUpIcon,
  medal: MilitaryTechIcon,
} as const;

function AchievementStat({
  achievement,
}: {
  achievement: NonNullable<PublicCreator["achievements"]>[number];
}) {
  const Icon =
    ACHIEVEMENT_ICONS[achievement.icon as keyof typeof ACHIEVEMENT_ICONS] ??
    EmojiEventsIcon;
  return (
    <Stack direction="row" spacing={1.25} alignItems="flex-start">
      <Box className="flex h-8 w-8 shrink-0 items-center justify-center bg-mustard">
        <Icon className="text-[16px] text-white" />
      </Box>
      <Box className="min-w-0">
        <KiribeTypography className="font-headline text-[0.625rem] leading-[0.625rem] tracking-[0.025em] text-mustard uppercase">
          {achievement.label}
        </KiribeTypography>
        <KiribeTypography className="mt-1 text-xs leading-4 text-white">
          {achievement.value}
        </KiribeTypography>
      </Box>
    </Stack>
  );
}

/** Featured creator split panel — Figma V5 Spotlight archive. */
function FeaturedCreatorPanel({ creator }: { creator: PublicCreator }) {
  const fullStoryHref = `${PublicRoutes.articles}?q=${encodeURIComponent(creator.name)}`;

  return (
    <Box>
      <KiribeTypography className="font-headline text-xs leading-4 tracking-[0.1em] text-mustard uppercase">
        Featured Creator
      </KiribeTypography>

      <Box className="mt-5 grid grid-cols-1 base:grid-cols-2">
        <Box className="relative min-h-[320px] bg-surface-muted sm:min-h-[440px] base:min-h-0">
          <KiribeImage
            src={creator.portrait}
            alt={creator.portrait?.alt ?? creator.name}
            fill
            sizes="(max-width: 1200px) 100vw, 608px"
          />
        </Box>

        <Stack justifyContent="center" className="bg-archive-hero p-6 md:p-10">
          <Box className="h-0.5 w-10 bg-mustard" />
          <KiribeTypography
            variant="h2"
            className="font-headline mt-5 text-[1.75rem] leading-none font-normal text-white md:text-[2.25rem]"
          >
            {creator.name}
          </KiribeTypography>
          <KiribeTypography className="font-headline mt-2 text-sm leading-5 tracking-[0.1em] text-mustard uppercase">
            {creator.role}
          </KiribeTypography>
          {creator.bio && (
            <KiribeTypography className="mt-5 text-sm leading-relaxed text-[#D1D5DC]">
              {creator.bio}
            </KiribeTypography>
          )}

          {creator.achievements && creator.achievements.length > 0 && (
            <Grid container spacing={2} className="mt-7">
              {creator.achievements.slice(0, 4).map((achievement) => (
                <Grid key={achievement.label} size={{ xs: 12, md: 6 }}>
                  <AchievementStat achievement={achievement} />
                </Grid>
              ))}
            </Grid>
          )}

          <KiribeLink
            href={fullStoryHref}
            underline="none"
            className="font-headline mt-7 flex items-center gap-3 bg-burgundy px-8 py-4 text-sm leading-5 tracking-[0.1em] text-white uppercase transition-colors duration-[var(--duration-fast)] hover:bg-burgundy-dark"
          >
            Full Story
            <ArrowForwardIcon className="text-[16px]" />
          </KiribeLink>
        </Stack>
      </Box>
    </Box>
  );
}

/** SpotlightCardV5 — sharp-edged 3:4 portrait card. */
function SpotlightCreatorCard({ creator }: { creator: PublicCreator }) {
  return (
    <Box>
      <Box className="relative aspect-[3/4] bg-border">
        <KiribeImage
          src={creator.portrait}
          alt={creator.portrait?.alt ?? creator.name}
          fill
          sizes="(max-width: 600px) 50vw, (max-width: 1200px) 33vw, 280px"
        />
      </Box>
      <KiribeTypography className="font-headline mt-4 text-lg leading-tight font-normal text-black">
        {creator.name}
      </KiribeTypography>
      <KiribeTypography className="mt-2 text-sm leading-5 text-ink-secondary">
        {creator.role}
      </KiribeTypography>
    </Box>
  );
}

export function SpotlightArchivePage({
  featuredCreator,
  moreCreators,
}: SpotlightArchivePageProps) {
  const isEmpty = !featuredCreator && moreCreators.length === 0;

  return (
    <Box className="pb-20">
      <CategoryHero
        title="Spotlight"
        accentColor={SPOTLIGHT_ACCENT}
        accentLabel="Spotlight"
        description="In-depth profiles of the directors, actors, and creatives defining contemporary culture."
      />

      <EditorialContainer className="py-12 md:py-12">
        {isEmpty ? (
          <EmptyState
            illustration={<SpotlightLampIllustration />}
            title="Spotlight profiles are coming soon"
            description="Creator profiles will appear here once the editors publish them."
            action={{ label: "Browse all articles", href: PublicRoutes.articles }}
          />
        ) : (
          <>
            {featuredCreator && <FeaturedCreatorPanel creator={featuredCreator} />}

            {moreCreators.length > 0 && (
              <Box className="mt-16 border-t border-surface-muted pt-12">
                <KiribeTypography className="font-headline text-xl leading-snug font-normal tracking-[0.025em] text-burgundy uppercase">
                  More Creators
                </KiribeTypography>
                <Box className="mt-2 h-0.5 w-8 bg-mustard" />

                <Grid container spacing={4} className="mt-4">
                  {moreCreators.map((creator) => (
                    <Grid key={creator.id} size={{ xs: 6, md: 4, base: 3 }}>
                      <SpotlightCreatorCard creator={creator} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </>
        )}
      </EditorialContainer>
    </Box>
  );
}

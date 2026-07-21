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
      <Box
        sx={{
          width: 32,
          height: 32,
          flexShrink: 0,
          bgcolor: "var(--color-mustard)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon sx={{ fontSize: 16, color: "#fff" }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <KiribeTypography
          sx={{
            fontFamily: "var(--font-headline), 'Outfit', sans-serif",
            fontSize: "0.625rem",
            lineHeight: "0.625rem",
            letterSpacing: "0.025em",
            textTransform: "uppercase",
            color: "var(--color-mustard)",
          }}
        >
          {achievement.label}
        </KiribeTypography>
        <KiribeTypography
          sx={{ mt: 0.5, fontSize: "0.75rem", lineHeight: "1rem", color: "#fff" }}
        >
          {achievement.value}
        </KiribeTypography>
      </Box>
    </Stack>
  );
}

/** Featured creator split panel — Figma V5 Spotlight archive. */
function FeaturedCreatorPanel({ creator }: { creator: PublicCreator }) {
  // No creator detail route yet — "Full Story" searches the archive for their coverage.
  const fullStoryHref = `${PublicRoutes.articles}?q=${encodeURIComponent(creator.name)}`;

  return (
    <Box>
      <KiribeTypography
        sx={{
          fontFamily: "var(--font-headline), 'Outfit', sans-serif",
          fontSize: "0.75rem",
          lineHeight: "1rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--color-mustard)",
        }}
      >
        Featured Creator
      </KiribeTypography>

      <Box
        sx={{
          mt: 2.5,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", base: "1fr 1fr" },
        }}
      >
        <Box
          sx={{
            position: "relative",
            minHeight: { xs: 320, sm: 440, base: "auto" },
            bgcolor: "#F3F4F6",
          }}
        >
          <KiribeImage
            src={creator.portrait}
            alt={creator.portrait?.alt ?? creator.name}
            fill
            sizes="(max-width: 1200px) 100vw, 608px"
          />
        </Box>

        <Stack justifyContent="center" sx={{ bgcolor: "#030712", p: { xs: 3, md: 5 } }}>
          <Box sx={{ width: 40, height: 2, bgcolor: "var(--color-mustard)" }} />
          <KiribeTypography
            variant="h2"
            sx={{
              mt: 2.5,
              fontFamily: "var(--font-headline), 'Outfit', sans-serif",
              fontWeight: 400,
              fontSize: { xs: "1.75rem", md: "2.25rem" },
              lineHeight: 1,
              color: "#fff",
            }}
          >
            {creator.name}
          </KiribeTypography>
          <KiribeTypography
            sx={{
              mt: 1,
              fontFamily: "var(--font-headline), 'Outfit', sans-serif",
              fontSize: "0.875rem",
              lineHeight: "1.25rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-mustard)",
            }}
          >
            {creator.role}
          </KiribeTypography>
          {creator.bio && (
            <KiribeTypography
              sx={{
                mt: 2.5,
                fontSize: "0.875rem",
                lineHeight: 1.625,
                color: "#D1D5DC",
              }}
            >
              {creator.bio}
            </KiribeTypography>
          )}

          {creator.achievements && creator.achievements.length > 0 && (
            <Grid container spacing={2} sx={{ mt: 3.5 }}>
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
            sx={{
              mt: 3.5,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              bgcolor: "primary.main",
              color: "#fff",
              px: 4,
              py: 2,
              fontFamily: "var(--font-headline), 'Outfit', sans-serif",
              fontSize: "0.875rem",
              lineHeight: "1.25rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              transition: "background-color var(--duration-fast) ease",
              "&:hover": { bgcolor: "var(--color-burgundy-dark)" },
            }}
          >
            Full Story
            <ArrowForwardIcon sx={{ fontSize: 16 }} />
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
      <Box
        sx={{
          position: "relative",
          aspectRatio: "3 / 4",
          bgcolor: "#E5E7EB",
        }}
      >
        <KiribeImage
          src={creator.portrait}
          alt={creator.portrait?.alt ?? creator.name}
          fill
          sizes="(max-width: 600px) 50vw, (max-width: 1200px) 33vw, 280px"
        />
      </Box>
      <KiribeTypography
        sx={{
          mt: 2,
          fontFamily: "var(--font-headline), 'Outfit', sans-serif",
          fontWeight: 400,
          fontSize: "1.125rem",
          lineHeight: 1.25,
          color: "#000",
        }}
      >
        {creator.name}
      </KiribeTypography>
      <KiribeTypography
        sx={{ mt: 1, fontSize: "0.875rem", lineHeight: "1.25rem", color: "#4A5565" }}
      >
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
    <Box sx={{ pb: 10 }}>
      <CategoryHero
        title="Spotlight"
        accentColor={SPOTLIGHT_ACCENT}
        accentLabel="Spotlight"
        description="In-depth profiles of the directors, actors, and creatives defining contemporary culture."
      />

      <EditorialContainer sx={{ py: { xs: 6, md: 6 } }}>
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
              <Box
                sx={{
                  mt: 8,
                  pt: 6,
                  borderTop: "1px solid #F3F4F6",
                }}
              >
                <KiribeTypography
                  sx={{
                    fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                    fontWeight: 400,
                    fontSize: "1.25rem",
                    lineHeight: 1.4,
                    letterSpacing: "0.025em",
                    textTransform: "uppercase",
                    color: "primary.main",
                  }}
                >
                  More Creators
                </KiribeTypography>
                <Box sx={{ mt: 1, width: 32, height: 2, bgcolor: "secondary.main" }} />

                <Grid container spacing={4} sx={{ mt: 2 }}>
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

"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import type { PublicCreator } from "@/lib/content/query-homepage";
import { KiribeImage } from "@/modules/shared/components/media/KiribeImage";
import {
  EditorialContainer,
  EditorialSection,
  KiribeTypography,
} from "@/modules/shared/components/ui";

type SpotlightProfileProps = {
  creator: PublicCreator | null;
};

export function SpotlightProfile({ creator }: SpotlightProfileProps) {
  if (!creator) {
    return (
      <EditorialSection className="bg-surface-alt py-12 md:py-16">
        <Stack alignItems="center" spacing={1} className="mb-6 text-center">
          <KiribeTypography
            variant="h3"
            className="text-2xl tracking-[0.04em] text-burgundy uppercase md:text-[1.75rem]"
          >
            Spotlight
          </KiribeTypography>
          <Box className="h-0.5 w-12 bg-mustard" />
        </Stack>
        <EditorialContainer>
          <Box className="rounded border border-dashed border-border py-12 text-center text-ink-secondary md:py-20">
            <KiribeTypography variant="body2" className="text-inherit">
              The Spotlight profile will feature here once selected by the editor.
            </KiribeTypography>
          </Box>
        </EditorialContainer>
      </EditorialSection>
    );
  }

  return (
    <EditorialSection className="bg-surface-alt py-0">
      <Stack alignItems="center" spacing={1} className="py-10 text-center md:py-14">
        <KiribeTypography
          variant="h3"
          className="text-2xl tracking-[0.04em] text-burgundy uppercase md:text-[1.75rem]"
        >
          Spotlight
        </KiribeTypography>
        <Box className="h-0.5 w-12 bg-mustard" />
      </Stack>

      <EditorialContainer className="pb-12 md:pb-20">
        <Grid container spacing={{ xs: 4, base: 0 }} alignItems="stretch">
          <Grid size={{ xs: 12, base: 6 }}>
            <Box className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-ink base:rounded-l-lg base:rounded-r-none">
              <KiribeImage
                src={creator.portrait}
                alt={creator.portrait?.alt ?? creator.name}
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
              />
              {creator.quote && (
                <>
                  <Box
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 55%)",
                    }}
                  />
                  <Box className="absolute right-5 bottom-5 left-5 border-l-[3px] border-mustard pl-3 md:right-8 md:bottom-8 md:left-8 md:pl-4">
                    <KiribeTypography className="font-headline text-lg leading-[1.35] font-medium text-white italic md:text-2xl">
                      &ldquo;{creator.quote}&rdquo;
                    </KiribeTypography>
                  </Box>
                </>
              )}
            </Box>
          </Grid>

          <Grid size={{ xs: 12, base: 6 }}>
            <Stack
              spacing={2.5}
              className="h-full justify-center rounded-lg bg-surface p-6 md:rounded-l-none md:rounded-r-lg md:p-10"
            >
              <Box>
                <KiribeTypography
                  variant="h2"
                  className="text-[clamp(2rem,1.6rem+1.8vw,3rem)] leading-[1.1] tracking-[-0.01em] text-burgundy"
                >
                  {creator.name}
                </KiribeTypography>
                <KiribeTypography className="mt-1 text-base font-medium text-ink md:text-lg">
                  {creator.role}
                </KiribeTypography>
              </Box>

              <Box className="h-0.5 w-24 bg-mustard" />

              {creator.bio && (
                <KiribeTypography
                  variant="body1"
                  className="text-base leading-[1.65] text-ink-secondary"
                >
                  {creator.bio}
                </KiribeTypography>
              )}

              {creator.achievements && creator.achievements.length > 0 && (
                <Grid container spacing={2} className="mt-2">
                  {creator.achievements.slice(0, 4).map((item) => (
                    <Grid key={item.label} size={{ xs: 6 }}>
                      <Stack spacing={0.25}>
                        <KiribeTypography className="font-headline text-2xl leading-[1.1] font-bold text-burgundy md:text-[1.75rem]">
                          {item.value}
                        </KiribeTypography>
                        <KiribeTypography
                          variant="caption"
                          className="tracking-[0.05em] text-ink-secondary uppercase"
                        >
                          {item.label}
                        </KiribeTypography>
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Stack>
          </Grid>
        </Grid>
      </EditorialContainer>
    </EditorialSection>
  );
}

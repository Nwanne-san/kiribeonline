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
      <EditorialSection sx={{ bgcolor: "#F9FAFB", py: { xs: 6, md: 8 } }}>
        <Stack alignItems="center" spacing={1} sx={{ textAlign: "center", mb: 3 }}>
          <KiribeTypography
            variant="h3"
            sx={{
              color: "primary.main",
              fontSize: { xs: "1.5rem", md: "1.75rem" },
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Spotlight
          </KiribeTypography>
          <Box sx={{ width: 48, height: 2, bgcolor: "secondary.main" }} />
        </Stack>
        <EditorialContainer>
          <Box
            sx={{
              py: { xs: 6, md: 10 },
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 1,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            <KiribeTypography variant="body2" sx={{ color: "inherit" }}>
              The Spotlight profile will feature here once selected by the editor.
            </KiribeTypography>
          </Box>
        </EditorialContainer>
      </EditorialSection>
    );
  }

  return (
    <EditorialSection sx={{ bgcolor: "#F9FAFB", py: { xs: 0, md: 0 } }}>
      <Stack alignItems="center" spacing={1} sx={{ py: { xs: 5, md: 7 }, textAlign: "center" }}>
        <KiribeTypography
          variant="h3"
          sx={{
            color: "primary.main",
            fontSize: { xs: "1.5rem", md: "1.75rem" },
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Spotlight
        </KiribeTypography>
        <Box sx={{ width: 48, height: 2, bgcolor: "secondary.main" }} />
      </Stack>

      <EditorialContainer sx={{ pb: { xs: 6, md: 10 } }}>
        <Grid container spacing={{ xs: 4, base: 0 }} alignItems="stretch">
          <Grid size={{ xs: 12, base: 6 }}>
            <Box
              sx={{
                position: "relative",
                width: "100%",
                aspectRatio: "4 / 5",
                borderRadius: { xs: 2, base: "8px 0 0 8px" },
                overflow: "hidden",
                bgcolor: "#1A1A1A",
              }}
            >
              <KiribeImage
                src={creator.portrait}
                alt={creator.portrait?.alt ?? creator.name}
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
              />
              {creator.quote && (
                <>
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 55%)",
                      pointerEvents: "none",
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      left: { xs: 20, md: 32 },
                      right: { xs: 20, md: 32 },
                      bottom: { xs: 20, md: 32 },
                      borderLeft: "3px solid",
                      borderColor: "secondary.main",
                      pl: { xs: 1.5, md: 2 },
                    }}
                  >
                    <KiribeTypography
                      sx={{
                        color: "#fff",
                        fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                        fontSize: { xs: "1.125rem", md: "1.5rem" },
                        fontWeight: 500,
                        lineHeight: 1.35,
                        fontStyle: "italic",
                      }}
                    >
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
              sx={{
                bgcolor: "background.paper",
                p: { xs: 3, md: 5 },
                borderRadius: { xs: 2, base: "0 8px 8px 0" },
                height: "100%",
                justifyContent: "center",
              }}
            >
              <Box>
                <KiribeTypography
                  variant="h2"
                  sx={{
                    color: "primary.main",
                    fontSize: "clamp(2rem, 1.6rem + 1.8vw, 3rem)",
                    lineHeight: 1.1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {creator.name}
                </KiribeTypography>
                <KiribeTypography
                  sx={{
                    color: "text.primary",
                    fontSize: { xs: "1rem", md: "1.125rem" },
                    fontWeight: 500,
                    mt: 0.5,
                  }}
                >
                  {creator.role}
                </KiribeTypography>
              </Box>

              <Box sx={{ width: 96, height: 2, bgcolor: "secondary.main" }} />

              {creator.bio && (
                <KiribeTypography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontSize: "1rem", lineHeight: 1.65 }}
                >
                  {creator.bio}
                </KiribeTypography>
              )}

              {creator.achievements && creator.achievements.length > 0 && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {creator.achievements.slice(0, 4).map((item) => (
                    <Grid key={item.label} size={{ xs: 6 }}>
                      <Stack spacing={0.25}>
                        <KiribeTypography
                          sx={{
                            color: "primary.main",
                            fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                            fontSize: { xs: "1.5rem", md: "1.75rem" },
                            fontWeight: 700,
                            lineHeight: 1.1,
                          }}
                        >
                          {item.value}
                        </KiribeTypography>
                        <KiribeTypography
                          variant="caption"
                          color="text.secondary"
                          sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
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

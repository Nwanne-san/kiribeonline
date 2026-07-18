"use client";

import Box from "@mui/material/Box";
import {
  EditorialContainer,
  KiribeTypography,
} from "@/modules/shared/components/ui";

export type CategoryHeroProps = {
  title: string;
  description?: string;
  /** Accent colour for the category badge + fallback wash. */
  accentColor?: string;
  /** Category label shown as a solid badge (e.g. "FILM"). */
  accentLabel?: string;
  kicker?: string;
  /** Optional background image URL. */
  image?: string;
};

/** Category page header — Figma V5: 288px image band with a left-to-right dark wash. */
export function CategoryHero({
  title,
  description,
  accentColor,
  accentLabel,
  kicker,
  image,
}: CategoryHeroProps) {
  const accent = accentColor ?? "#7F0400";

  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        overflow: "hidden",
        bgcolor: "#030712",
        display: "flex",
        alignItems: "flex-end",
        minHeight: { xs: 240, md: 288 },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          ...(image
            ? {
                backgroundImage: `url(${image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {
                background: `radial-gradient(circle at 75% 20%, ${accent}55, transparent 60%), #030712`,
              }),
        }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(3,7,18,0.9) 0%, rgba(3,7,18,0.6) 50%, rgba(0,0,0,0) 100%)",
        }}
      />
      <EditorialContainer sx={{ position: "relative", pt: { xs: 8, md: 10 }, pb: 5 }}>
        {accentLabel ? (
          <Box
            component="span"
            sx={{
              display: "inline-block",
              bgcolor: accent,
              color: "#fff",
              fontFamily: "var(--font-headline), 'Outfit', sans-serif",
              fontSize: "0.75rem",
              lineHeight: "1rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              px: 1.5,
              py: 0.5,
            }}
          >
            {accentLabel}
          </Box>
        ) : (
          kicker && (
            <KiribeTypography variant="kicker" color="secondary.main" sx={{ display: "block" }}>
              {kicker}
            </KiribeTypography>
          )
        )}
        <KiribeTypography
          variant="h1"
          sx={{
            mt: 2,
            color: "common.white",
            fontFamily: "var(--font-headline), 'Outfit', sans-serif",
            fontWeight: 400,
            fontSize: { xs: "2.25rem", md: "3rem" },
            lineHeight: 1,
            textTransform: "capitalize",
          }}
        >
          {title}
        </KiribeTypography>
        {description && (
          <KiribeTypography
            sx={{
              mt: 1.5,
              maxWidth: 576,
              color: "#D1D5DC",
              fontSize: "1rem",
              lineHeight: 1.625,
            }}
          >
            {description}
          </KiribeTypography>
        )}
      </EditorialContainer>
    </Box>
  );
}

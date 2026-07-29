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
      className="relative overflow-hidden bg-[#030712] flex items-end min-h-[240px] md:min-h-[288px]"
    >
      <Box
        className="absolute inset-0 bg-cover bg-center"
        style={
          image
            ? { backgroundImage: `url(${image})` }
            : {
                background: `radial-gradient(circle at 75% 20%, ${accent}55, transparent 60%), #030712`,
              }
        }
      />
      <Box
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(3,7,18,0.9) 0%, rgba(3,7,18,0.6) 50%, rgba(0,0,0,0) 100%)",
        }}
      />
      <EditorialContainer className="relative pt-16 md:pt-20 pb-5">
        {accentLabel ? (
          <Box
            component="span"
            className="inline-block text-white font-headline text-xs leading-4 tracking-[0.1em] uppercase px-1.5 py-0.5"
            style={{ backgroundColor: accent }}
          >
            {accentLabel}
          </Box>
        ) : (
          kicker && (
            <KiribeTypography variant="kicker" color="secondary.main" className="block">
              {kicker}
            </KiribeTypography>
          )
        )}
        <KiribeTypography
          variant="h1"
          className="mt-4 text-white font-headline font-normal text-4xl md:text-5xl leading-none capitalize"
        >
          {title}
        </KiribeTypography>
        {description && (
          <KiribeTypography className="mt-3 max-w-[576px] text-[#D1D5DC] text-base leading-[1.625]">
            {description}
          </KiribeTypography>
        )}
      </EditorialContainer>
    </Box>
  );
}

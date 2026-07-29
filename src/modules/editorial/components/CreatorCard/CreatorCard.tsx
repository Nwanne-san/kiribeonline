"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { PublicCreator } from "@/lib/content/query-homepage";
import { KiribeImage } from "@/modules/shared/components/media/KiribeImage";
import { KiribeTypography } from "@/modules/shared/components/ui";

type CreatorCardProps = {
  creator: PublicCreator;
};

export function CreatorCard({ creator }: CreatorCardProps) {
  return (
    <Stack spacing={1.5}>
      <Box className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-black/5">
        <KiribeImage
          src={creator.portrait}
          alt={creator.portrait?.alt ?? creator.name}
          fill
          sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 286px"
        />
      </Box>
      <Box>
        <KiribeTypography variant="cardTitle" className="text-lg leading-[1.3]">
          {creator.name}
        </KiribeTypography>
        <KiribeTypography
          variant="caption"
          color="text.secondary"
          className="block mt-0.5 text-[0.8125rem]"
        >
          {creator.role}
        </KiribeTypography>
        {creator.badges && creator.badges.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.5} className="mt-2">
            {creator.badges.map((badge) => (
              <Box
                key={badge.label}
                component="span"
                className="text-[0.6rem] font-bold tracking-[0.06em] uppercase px-1.5 py-0.5 rounded text-white"
                style={{ backgroundColor: badge.color ?? "var(--color-burgundy)" }}
              >
                {badge.label}
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}

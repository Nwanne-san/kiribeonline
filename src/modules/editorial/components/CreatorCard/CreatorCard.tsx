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
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "3 / 4",
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "action.hover",
        }}
      >
        <KiribeImage
          src={creator.portrait}
          alt={creator.portrait?.alt ?? creator.name}
          fill
          sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 286px"
        />
      </Box>
      <Box>
        <KiribeTypography
          variant="cardTitle"
          sx={{ fontSize: "1.125rem", lineHeight: 1.3 }}
        >
          {creator.name}
        </KiribeTypography>
        <KiribeTypography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 0.25, fontSize: "0.8125rem" }}
        >
          {creator.role}
        </KiribeTypography>
        {creator.badges && creator.badges.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
            {creator.badges.map((badge) => (
              <Box
                key={badge.label}
                component="span"
                sx={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 0.5,
                  bgcolor: badge.color ?? "primary.main",
                  color: "#fff",
                }}
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

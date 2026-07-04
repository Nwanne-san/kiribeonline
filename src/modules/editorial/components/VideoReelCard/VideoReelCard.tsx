"use client";

import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import InstagramIcon from "@mui/icons-material/Instagram";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import YouTubeIcon from "@mui/icons-material/YouTube";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { useState } from "react";
import type { PublicReel } from "@/lib/content/query-homepage";
import { parseReelEmbed } from "@/lib/reels/parse-embed";
import { KiribeImage } from "@/modules/shared/components/media/KiribeImage";
import { KiribeLink, KiribeTypography } from "@/modules/shared/components/ui";

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: <InstagramIcon sx={{ fontSize: 14 }} />,
  youtube: <YouTubeIcon sx={{ fontSize: 14 }} />,
  tiktok: (
    <Box component="span" sx={{ fontSize: "0.65rem", fontWeight: 700 }}>
      TT
    </Box>
  ),
};

type VideoReelCardProps = {
  reel: PublicReel;
};

export function VideoReelCard({ reel }: VideoReelCardProps) {
  const embed = parseReelEmbed(reel.externalUrl);
  const [activated, setActivated] = useState(false);

  const cardWidth = { xs: 180, sm: 200 } as const;
  const cardHeight = { xs: 320, sm: 356 } as const;

  // No embed possible → render a link-out poster (same as before).
  if (!embed || !embed.fitsPortraitCard) {
    return (
      <KiribeLink
        href={reel.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        underline="none"
        color="inherit"
      >
        <ReelPoster reel={reel} width={cardWidth} height={cardHeight} showExternalIcon />
      </KiribeLink>
    );
  }

  // Activate-on-click pattern — keeps the homepage light by not loading
  // third-party iframes until the user interacts.
  if (!activated) {
    return (
      <Box
        component="button"
        type="button"
        onClick={() => setActivated(true)}
        aria-label={`Play ${reel.title}`}
        sx={{
          all: "unset",
          cursor: "pointer",
          display: "block",
          "&:focus-visible > div": {
            outline: "2px solid",
            outlineColor: "secondary.main",
            outlineOffset: 2,
          },
        }}
      >
        <ReelPoster reel={reel} width={cardWidth} height={cardHeight} />
      </Box>
    );
  }

  // Live embed.
  return (
    <Box
      sx={{
        position: "relative",
        width: cardWidth,
        height: cardHeight,
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "#0A0A0A",
      }}
    >
      <Box
        component="iframe"
        src={embed.embedUrl}
        title={reel.title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
        }}
      />
      <IconButton
        size="small"
        aria-label="Open on original site"
        component={KiribeLink}
        href={reel.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 28,
          height: 28,
          bgcolor: "rgba(0,0,0,0.55)",
          color: "#fff",
          "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
        }}
      >
        <OpenInNewIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Box>
  );
}

function ReelPoster({
  reel,
  width,
  height,
  showExternalIcon = false,
}: {
  reel: PublicReel;
  width: { xs: number; sm: number };
  height: { xs: number; sm: number };
  showExternalIcon?: boolean;
}) {
  return (
    <Box
      sx={{
        position: "relative",
        width,
        height,
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "#0A0A0A",
      }}
    >
      <KiribeImage
        src={reel.thumbnail}
        alt={reel.thumbnail?.alt ?? reel.title}
        fill
        sizes="200px"
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 55%)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
          }}
        >
          {showExternalIcon ? (
            <OpenInNewIcon sx={{ color: "primary.main", fontSize: 22 }} />
          ) : (
            <PlayArrowIcon sx={{ color: "primary.main", fontSize: 26, ml: 0.25 }} />
          )}
        </Box>
      </Box>
      <Box
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 28,
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          bgcolor: "rgba(0,0,0,0.45)",
        }}
      >
        <BookmarkBorderIcon sx={{ color: "#fff", fontSize: 16 }} />
      </Box>
      <Box
        sx={{
          position: "absolute",
          top: 8,
          left: 8,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          bgcolor: "rgba(0,0,0,0.55)",
          color: "#fff",
          px: 0.75,
          py: 0.25,
          borderRadius: 0.5,
        }}
      >
        {PLATFORM_ICONS[reel.platform] ?? null}
        <KiribeTypography
          component="span"
          sx={{
            color: "inherit",
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {reel.label}
        </KiribeTypography>
      </Box>
      <Box sx={{ position: "absolute", bottom: 10, left: 12, right: 12 }}>
        <KiribeTypography
          sx={{
            color: "#fff",
            fontSize: "0.8125rem",
            fontWeight: 600,
            lineHeight: 1.3,
            textShadow: "0 1px 3px rgba(0,0,0,0.6)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {reel.title}
        </KiribeTypography>
      </Box>
    </Box>
  );
}

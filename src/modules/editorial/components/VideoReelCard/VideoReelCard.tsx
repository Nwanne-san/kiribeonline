"use client";

import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import InstagramIcon from "@mui/icons-material/Instagram";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import YouTubeIcon from "@mui/icons-material/YouTube";
import Box from "@mui/material/Box";
import type { PublicReel } from "@/lib/content/query-homepage";
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
  /**
   * Fired when the card is clicked. Parent owns the modal so the same card can
   * live inside homepage rows and the /categories/videos archive without each
   * card carrying its own dialog. When omitted (unusual — only the rare case
   * where an embed isn't possible), the card still link-outs.
   */
  onSelect?: (reel: PublicReel) => void;
  /** Layout tuning per surface. Homepage row keeps the tight portrait size;
   * the archive grid passes larger dimensions. */
  size?: "row" | "grid";
};

const SIZE_PRESETS = {
  row: {
    width: { xs: 180, sm: 200 } as const,
    height: { xs: 320, sm: 356 } as const,
    sizes: "200px",
  },
  grid: {
    width: { xs: "100%", sm: "100%" } as const,
    height: { xs: 380, sm: 440 } as const,
    sizes: "(max-width: 600px) 90vw, 260px",
  },
} as const;

export function VideoReelCard({ reel, onSelect, size = "row" }: VideoReelCardProps) {
  const preset = SIZE_PRESETS[size];

  // Only ever link-out if the parent hasn't wired up a modal. When `onSelect`
  // is present we always open the modal — the modal itself gracefully falls
  // back to a "Watch on original site" screen when a URL can't be embedded,
  // so the reader never gets bounced out to another tab from the card.
  if (!onSelect) {
    return (
      <KiribeLink
        href={reel.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        underline="none"
        color="inherit"
      >
        <ReelPoster
          reel={reel}
          width={preset.width}
          height={preset.height}
          sizes={preset.sizes}
          showExternalIcon
        />
      </KiribeLink>
    );
  }

  return (
    <Box
      component="button"
      type="button"
      onClick={() => onSelect(reel)}
      aria-label={`Play ${reel.title}`}
      sx={{
        all: "unset",
        cursor: "pointer",
        display: "block",
        width: "100%",
        "&:focus-visible > div": {
          outline: "2px solid",
          outlineColor: "secondary.main",
          outlineOffset: 2,
        },
      }}
    >
      <ReelPoster
        reel={reel}
        width={preset.width}
        height={preset.height}
        sizes={preset.sizes}
      />
    </Box>
  );
}

function ReelPoster({
  reel,
  width,
  height,
  sizes,
  showExternalIcon = false,
}: {
  reel: PublicReel;
  width: { xs: number | string; sm: number | string };
  height: { xs: number; sm: number };
  sizes: string;
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
        // Hover on the poster (or its clickable parent) lifts the play button
        // from subtle white to brand mustard for a stronger affordance.
        "&:hover .reel-play-btn, .MuiButtonBase-root:hover & .reel-play-btn, button:hover & .reel-play-btn, a:hover & .reel-play-btn":
          {
            bgcolor: "var(--color-mustard)",
            transform: "scale(1.08)",
          },
        "& .reel-play-btn": {
          transition:
            "background-color var(--duration-base) ease, transform var(--duration-base) ease",
        },
      }}
    >
      <KiribeImage
        src={reel.thumbnail}
        alt={reel.thumbnail?.alt ?? reel.title}
        fill
        sizes={sizes}
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
          className="reel-play-btn"
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

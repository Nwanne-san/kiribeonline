"use client";

import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import InstagramIcon from "@mui/icons-material/Instagram";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import YouTubeIcon from "@mui/icons-material/YouTube";
import Box from "@mui/material/Box";
import type { PublicReel } from "@/lib/content/query-homepage";
import { parseReelEmbed } from "@/lib/reels/parse-embed";
import { KiribeImage } from "@/modules/shared/components/media/KiribeImage";
import { KiribeLink, KiribeTypography } from "@/modules/shared/components/ui";
import { cn } from "@/modules/shared/components/tw";

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: <InstagramIcon className="text-[14px]" />,
  youtube: <YouTubeIcon className="text-[14px]" />,
  tiktok: (
    <Box component="span" className="text-[0.65rem] font-bold">
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
    className: "w-[180px] sm:w-[200px] h-[320px] sm:h-[356px]",
    sizes: "200px",
  },
  grid: {
    className: "w-full h-[380px] sm:h-[440px]",
    sizes: "(max-width: 600px) 90vw, 260px",
  },
} as const;

export function VideoReelCard({ reel, onSelect, size = "row" }: VideoReelCardProps) {
  const embed = parseReelEmbed(reel.externalUrl);
  const preset = SIZE_PRESETS[size];

  // No modal-embeddable target — fall back to opening the source in a new tab.
  if (!embed || !embed.embedUrl || !onSelect) {
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
          className={preset.className}
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
      className="[all:unset] cursor-pointer block w-full focus-visible:[&>div]:outline focus-visible:[&>div]:outline-2 focus-visible:[&>div]:outline-mustard focus-visible:[&>div]:outline-offset-2"
    >
      <ReelPoster
        reel={reel}
        className={preset.className}
        sizes={preset.sizes}
      />
    </Box>
  );
}

function ReelPoster({
  reel,
  className,
  sizes,
  showExternalIcon = false,
}: {
  reel: PublicReel;
  className: string;
  sizes: string;
  showExternalIcon?: boolean;
}) {
  return (
    <Box
      className={cn(
        "relative rounded-lg overflow-hidden bg-[#0A0A0A]",
        className
      )}
    >
      <KiribeImage
        src={reel.thumbnail}
        alt={reel.thumbnail?.alt ?? reel.title}
        fill
        sizes={sizes}
      />
      <Box
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 55%)",
        }}
      />
      <Box className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Box className="w-12 h-12 rounded-full bg-white/92 flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.3)]">
          {showExternalIcon ? (
            <OpenInNewIcon className="text-burgundy text-[22px]" />
          ) : (
            <PlayArrowIcon className="text-burgundy text-[26px] ml-0.5" />
          )}
        </Box>
      </Box>
      <Box className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/45">
        <BookmarkBorderIcon className="text-white text-base" />
      </Box>
      <Box className="absolute top-2 left-2 flex items-center gap-1 bg-black/55 text-white px-1.5 py-0.5 rounded">
        {PLATFORM_ICONS[reel.platform] ?? null}
        <KiribeTypography
          component="span"
          className="text-inherit text-[0.65rem] font-bold tracking-[0.05em] uppercase"
        >
          {reel.label}
        </KiribeTypography>
      </Box>
      <Box className="absolute bottom-2.5 left-3 right-3">
        <KiribeTypography className="text-white text-[0.8125rem] font-semibold leading-[1.3] line-clamp-2 [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
          {reel.title}
        </KiribeTypography>
      </Box>
    </Box>
  );
}

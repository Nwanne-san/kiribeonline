"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import type { PublicReel } from "@/lib/content/query-homepage";
import { parseReelEmbed } from "@/lib/reels/parse-embed";
import { KiribeLink, KiribeTypography } from "@/modules/shared/components/ui";
import { cn } from "@/modules/shared/components/tw";

type VideoModalProps = {
  reel: PublicReel | null;
  onClose: () => void;
};

/**
 * Shared "play a reel bigger" modal. Portrait 9:16 on desktop (matches TikTok/
 * Instagram/YouTube Shorts framing), full-screen on mobile so the video isn't
 * squeezed by browser chrome. Falls back to a link-out when the platform doesn't
 * expose an embeddable URL.
 */
export function VideoModal({ reel, onClose }: VideoModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const embed = reel ? parseReelEmbed(reel.externalUrl) : null;

  return (
    <Dialog
      open={Boolean(reel)}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth={false}
      slotProps={{
        paper: {
          className: cn(
            "shadow-none overflow-hidden",
            fullScreen
              ? "bg-black m-0 rounded-none w-full"
              : "bg-transparent m-4 sm:m-8 rounded-lg w-auto"
          ),
        },
      }}
    >
      <Box
        className={cn(
          "relative bg-black",
          fullScreen
            ? "w-screen h-screen"
            : "w-[min(420px,90vw)] h-[min(75vh,746px)] aspect-[9/16]"
        )}
      >
        {embed?.embedUrl ? (
          <Box
            component="iframe"
            src={embed.embedUrl}
            title={reel?.title ?? "Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        ) : reel ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={2}
            className="absolute inset-0 p-8 text-center text-white"
          >
            <KiribeTypography className="text-inherit text-base font-semibold">
              This video can&rsquo;t be embedded.
            </KiribeTypography>
            <KiribeLink
              href={reel.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-white underline underline-offset-[3px] text-sm"
            >
              Open on original site
              <OpenInNewIcon className="text-[16px]" />
            </KiribeLink>
          </Stack>
        ) : null}

        {reel && embed?.embedUrl && (
          <IconButton
            aria-label="Open on original site"
            component={KiribeLink}
            href={reel.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            className="absolute top-3 right-14 w-9 h-9 bg-black/55 text-white hover:bg-black/75"
          >
            <OpenInNewIcon className="text-[18px]" />
          </IconButton>
        )}

        <IconButton
          aria-label="Close video"
          onClick={onClose}
          size="small"
          className="absolute top-3 right-3 w-9 h-9 bg-black/55 text-white hover:bg-black/75"
        >
          <CloseRoundedIcon className="text-[20px]" />
        </IconButton>
      </Box>
    </Dialog>
  );
}

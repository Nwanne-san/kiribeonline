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
          sx: {
            bgcolor: fullScreen ? "#000" : "transparent",
            boxShadow: "none",
            margin: fullScreen ? 0 : { xs: 2, sm: 4 },
            borderRadius: fullScreen ? 0 : 2,
            overflow: "hidden",
            width: fullScreen ? "100%" : "auto",
          },
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: fullScreen ? "100vw" : "min(420px, 90vw)",
          height: fullScreen ? "100vh" : "min(75vh, 746px)",
          aspectRatio: fullScreen ? "auto" : "9 / 16",
          bgcolor: "#000",
        }}
      >
        {embed?.embedUrl ? (
          <Box
            component="iframe"
            src={embed.embedUrl}
            title={reel?.title ?? "Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              border: 0,
            }}
          />
        ) : reel ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={2}
            sx={{ position: "absolute", inset: 0, p: 4, textAlign: "center", color: "#fff" }}
          >
            <KiribeTypography sx={{ color: "inherit", fontSize: "1rem", fontWeight: 600 }}>
              This video can&rsquo;t be embedded.
            </KiribeTypography>
            <KiribeLink
              href={reel.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                color: "#fff",
                textDecoration: "underline",
                textUnderlineOffset: 3,
                fontSize: "0.875rem",
              }}
            >
              Open on original site
              <OpenInNewIcon sx={{ fontSize: 16 }} />
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
            sx={{
              position: "absolute",
              top: 12,
              right: 56,
              width: 36,
              height: 36,
              bgcolor: "rgba(0,0,0,0.55)",
              color: "#fff",
              "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
            }}
          >
            <OpenInNewIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}

        <IconButton
          aria-label="Close video"
          onClick={onClose}
          size="small"
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 36,
            height: 36,
            bgcolor: "rgba(0,0,0,0.55)",
            color: "#fff",
            "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>
    </Dialog>
  );
}

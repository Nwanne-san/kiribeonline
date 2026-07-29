"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { KiribeLink, KiribeTypography } from "@/modules/shared/components/ui";

/** Height of the control bar above the embed. */
const CONTROL_BAR_HEIGHT = 48;

/**
 * Desktop frame per platform. Instagram and TikTok embeds render their own
 * chrome around the video — IG stacks an avatar + Follow header above the media
 * and a likes/caption footer below it — so a bare 9:16 box crops them. Each
 * platform gets a width and a generous height instead of one shared ratio.
 */
const PORTRAIT_FRAME: Record<string, { width: string; height: string }> = {
  instagram: { width: "min(480px, 92vw)", height: "min(88vh, 900px)" },
  tiktok: { width: "min(440px, 92vw)", height: "min(86vh, 860px)" },
};

/** Landscape players (YouTube, Vimeo) — wide box, 16:9 media. */
const LANDSCAPE_FRAME = { width: "min(1100px, 94vw)", height: "min(80vh, 700px)" };

/** Portrait default for anything else that framed itself 9:16. */
const PORTRAIT_DEFAULT = { width: "min(420px, 90vw)", height: "min(80vh, 760px)" };

export type EmbedModalProps = {
  open: boolean;
  onClose: () => void;
  /** iframe `src`. When absent the modal shows a link-out instead. */
  embedUrl?: string | null;
  /** Original URL — the "open on original site" target. */
  externalUrl: string;
  title: string;
  /** Drives the frame size (`instagram`, `tiktok`, `youtube`, `vimeo`, …). */
  platform?: string;
  /** `9 / 16` picks the portrait frame; anything else goes landscape. */
  aspectRatio?: string;
};

/**
 * The single "play this thing bigger" modal, shared by homepage/archive reels
 * and in-article video embeds so both behave identically.
 *
 * The close and open-original controls live in a bar *above* the embed rather
 * than floating over its top-right corner — that corner is where Instagram puts
 * its Follow button and TikTok its profile link, and overlaying them made both
 * unclickable.
 */
export function EmbedModal({
  open,
  onClose,
  embedUrl,
  externalUrl,
  title,
  platform,
  aspectRatio,
}: EmbedModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const isPortrait =
    aspectRatio === "9 / 16" || platform === "instagram" || platform === "tiktok";
  const frame = isPortrait
    ? (platform ? PORTRAIT_FRAME[platform] : undefined) ?? PORTRAIT_DEFAULT
    : LANDSCAPE_FRAME;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth={false}
      aria-labelledby="embed-modal-title"
      slotProps={{
        paper: {
          sx: {
            bgcolor: "#000",
            boxShadow: "none",
            // Opt out of the themed light dialog border — this surface is a
            // black media frame, not a content dialog.
            border: "none",
            margin: fullScreen ? 0 : { xs: 2, sm: 4 },
            // Sharp corners, matching the project-wide surface rule.
            borderRadius: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            width: fullScreen ? "100%" : frame.width,
            height: fullScreen ? "100%" : frame.height,
            maxWidth: "100vw",
          },
        },
      }}
    >
      {/* ── Control bar (never overlaps the embed) ─────────────── */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          height: CONTROL_BAR_HEIGHT,
          flexShrink: 0,
          px: 1.5,
          bgcolor: "#000",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <KiribeTypography
          id="embed-modal-title"
          sx={{
            flex: 1,
            minWidth: 0,
            color: "#fff",
            fontSize: "0.875rem",
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </KiribeTypography>

        <IconButton
          aria-label="Open on original site"
          component={KiribeLink}
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          sx={{
            width: 34,
            height: 34,
            color: "#fff",
            "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
          }}
        >
          <OpenInNewIcon sx={{ fontSize: 18 }} />
        </IconButton>

        <IconButton
          aria-label="Close video"
          onClick={onClose}
          size="small"
          sx={{
            width: 34,
            height: 34,
            color: "#fff",
            "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Stack>

      {/* ── Media ──────────────────────────────────────────────── */}
      <Box sx={{ position: "relative", flex: 1, minHeight: 0, bgcolor: "#000" }}>
        {embedUrl ? (
          <Box
            component="iframe"
            src={embedUrl}
            title={title}
            // Minimal capabilities for the player to run; no camera/mic/geo.
            sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            scrolling="no"
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              border: 0,
            }}
          />
        ) : (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={2}
            sx={{
              position: "absolute",
              inset: 0,
              p: 4,
              textAlign: "center",
              color: "#fff",
            }}
          >
            <KiribeTypography
              sx={{ color: "inherit", fontSize: "1rem", fontWeight: 600 }}
            >
              This video can&rsquo;t be embedded.
            </KiribeTypography>
            <KiribeLink
              href={externalUrl}
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
        )}
      </Box>
    </Dialog>
  );
}

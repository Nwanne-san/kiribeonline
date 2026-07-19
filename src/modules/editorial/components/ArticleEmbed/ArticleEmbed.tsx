"use client";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Box from "@mui/material/Box";
import { useState } from "react";
import { parseEmbed, type ArticleEmbed as ParsedEmbed } from "@/lib/embeds/parse-embed";
import { KiribeLink, KiribeTypography } from "@/modules/shared/components/ui";

export type ArticleEmbedProps = {
  /** The stored, author-supplied URL. This is the ONLY trusted input. */
  url: string;
};

const PLATFORM_LABEL: Record<ParsedEmbed["platform"], string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  instagram: "Instagram",
  tiktok: "TikTok",
  spotify: "Spotify",
  "link-card": "Link",
};

/**
 * Public renderer for an embed node.
 *
 * SECURITY: we re-run `parseEmbed` on the stored `url` on every render and use
 * ITS `embedUrl`. The `embedUrl` persisted in the node is never trusted — this
 * runs during SSR and on the client, so a tampered/stale stored value or a host
 * that has since left the allow-list can never produce an iframe. Anything that
 * doesn't resolve to an allow-listed platform degrades to a safe link-card.
 *
 * The iframe mounts only after an explicit click (no third-party network
 * request until the reader opts in), mirroring the VideoReelCard pattern.
 */
export function ArticleEmbed({ url }: ArticleEmbedProps) {
  const [activated, setActivated] = useState(false);
  const embed = parseEmbed(url);

  // Invalid / non-http(s) URL — render nothing rather than a dead card.
  if (!embed) return null;

  // Link-card fallback (unknown host or unrenderable): a plain link-out. Never
  // an iframe.
  if (embed.layout === "card" || !embed.embedUrl) {
    return (
      <Box component="figure" sx={{ my: 4, mx: 0 }}>
        <KiribeLink
          href={embed.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          underline="none"
          color="inherit"
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              bgcolor: "background.paper",
              transition: "border-color 120ms",
              "@media (prefers-reduced-motion: reduce)": { transition: "none" },
              "&:hover": { borderColor: "primary.main" },
            }}
          >
            <OpenInNewIcon sx={{ color: "primary.main", fontSize: 20, flexShrink: 0 }} />
            <Box sx={{ minWidth: 0 }}>
              <KiribeTypography sx={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                {embed.title ?? "Open link"}
              </KiribeTypography>
              <KiribeTypography
                sx={{
                  fontSize: "0.8125rem",
                  color: "text.secondary",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {embed.externalUrl}
              </KiribeTypography>
            </Box>
          </Box>
        </KiribeLink>
      </Box>
    );
  }

  const label = PLATFORM_LABEL[embed.platform];
  const isAudio = embed.layout === "audio";

  // Framing: fixed-height for audio (Spotify), responsive aspect box for video.
  const frameSx = isAudio
    ? { position: "relative" as const, width: "100%", height: embed.frameHeight ?? 152 }
    : {
        position: "relative" as const,
        width: "100%",
        aspectRatio: embed.aspectRatio ?? "16 / 9",
        maxWidth: (embed.aspectRatio ?? "16 / 9").startsWith("9 /") ? 360 : "100%",
        mx: "auto",
        bgcolor: "#0A0A0A",
        borderRadius: 2,
        overflow: "hidden",
      };

  if (!activated) {
    return (
      <Box component="figure" sx={{ my: 4, mx: 0 }}>
        <Box
          component="button"
          type="button"
          onClick={() => setActivated(true)}
          aria-label={`Load ${label} embed`}
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
          <Box
            sx={{
              ...frameSx,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: isAudio ? "background.paper" : "#111",
              border: isAudio ? "1px solid" : "none",
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 10,
                left: 10,
                px: 1,
                py: 0.25,
                borderRadius: 0.75,
                bgcolor: "rgba(0,0,0,0.55)",
                color: "#fff",
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </Box>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                bgcolor: "rgba(255,255,255,0.92)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
              }}
            >
              <PlayArrowIcon sx={{ color: "primary.main", fontSize: 30, ml: 0.25 }} />
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box component="figure" sx={{ my: 4, mx: 0 }}>
      <Box sx={frameSx}>
        <Box
          component="iframe"
          src={embed.embedUrl}
          title={`${label} embed`}
          loading="lazy"
          // Minimal capabilities for the player to run; no camera/mic/geolocation.
          sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
          allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
          allowFullScreen
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: 0,
          }}
        />
      </Box>
    </Box>
  );
}

"use client";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Box from "@mui/material/Box";
import { useState } from "react";
import { parseEmbed, type ArticleEmbed as ParsedEmbed } from "@/lib/embeds/parse-embed";
import { KiribeLink, KiribeTypography } from "@/modules/shared/components/ui";
import { cn } from "@/modules/shared/components/tw";

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

function frameStyle(embed: ParsedEmbed, isAudio: boolean): React.CSSProperties {
  if (isAudio) {
    return { position: "relative", width: "100%", height: embed.frameHeight ?? 152 };
  }
  const isPortrait = (embed.aspectRatio ?? "16 / 9").startsWith("9 /");
  return {
    position: "relative",
    width: "100%",
    aspectRatio: embed.aspectRatio ?? "16 / 9",
    maxWidth: isPortrait ? 360 : "100%",
    marginInline: "auto",
  };
}

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
      <Box component="figure" className="my-8 mx-0">
        <KiribeLink
          href={embed.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          underline="none"
          color="inherit"
        >
          <Box className="flex items-center gap-3 p-4 border border-border rounded-lg bg-surface transition-[border-color] duration-[120ms] motion-reduce:transition-none hover:border-burgundy">
            <OpenInNewIcon className="text-burgundy text-[20px] shrink-0" />
            <Box className="min-w-0">
              <KiribeTypography className="font-semibold text-[0.9375rem]">
                {embed.title ?? "Open link"}
              </KiribeTypography>
              <KiribeTypography className="text-[0.8125rem] text-ink-secondary truncate">
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

  if (!activated) {
    return (
      <Box component="figure" className="my-8 mx-0">
        <Box
          component="button"
          type="button"
          onClick={() => setActivated(true)}
          aria-label={`Load ${label} embed`}
          className="[all:unset] cursor-pointer block w-full focus-visible:[&>div]:outline focus-visible:[&>div]:outline-2 focus-visible:[&>div]:outline-mustard focus-visible:[&>div]:outline-offset-2"
        >
          <Box
            className={cn(
              "flex items-center justify-center rounded-lg overflow-hidden",
              isAudio ? "bg-surface border border-border" : "bg-[#111]"
            )}
            style={frameStyle(embed, isAudio)}
          >
            <Box className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/55 text-white text-[0.6875rem] font-bold tracking-[0.06em] uppercase">
              {label}
            </Box>
            <Box className="w-14 h-14 rounded-full bg-white/92 flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.3)]">
              <PlayArrowIcon className="text-burgundy text-[30px] ml-0.5" />
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box component="figure" className="my-8 mx-0">
      <Box
        className="bg-[#0A0A0A] rounded-lg overflow-hidden"
        style={frameStyle(embed, isAudio)}
      >
        <Box
          component="iframe"
          src={embed.embedUrl}
          title={`${label} embed`}
          loading="lazy"
          // Minimal capabilities for the player to run; no camera/mic/geolocation.
          sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
          allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </Box>
    </Box>
  );
}

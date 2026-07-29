"use client";

import type { PublicReel } from "@/lib/content/query-homepage";
import { parseReelEmbed } from "@/lib/reels/parse-embed";
import { EmbedModal } from "@/modules/shared/components/media/EmbedModal";

type VideoModalProps = {
  reel: PublicReel | null;
  onClose: () => void;
};

/**
 * Reel lightbox — maps a `PublicReel` onto the shared `EmbedModal` so reels and
 * in-article video embeds render through one implementation (same framing, same
 * control bar, same fullscreen behaviour on mobile).
 */
export function VideoModal({ reel, onClose }: VideoModalProps) {
  const embed = reel ? parseReelEmbed(reel.externalUrl) : null;

  return (
    <EmbedModal
      open={Boolean(reel)}
      onClose={onClose}
      embedUrl={embed?.embedUrl}
      externalUrl={reel?.externalUrl ?? "#"}
      title={reel?.title ?? "Video"}
      platform={embed?.platform}
      aspectRatio={embed?.aspectRatio}
    />
  );
}

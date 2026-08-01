"use client";

import type { PublicReel } from "@/lib/content/query-homepage";
import { parseEmbed } from "@/lib/embeds/parse-embed";
import { EmbedModal } from "@/modules/shared/components/media/EmbedModal";

type VideoModalProps = {
  reel: PublicReel | null;
  onClose: () => void;
};

/**
 * Reel lightbox — maps a `PublicReel` onto the shared `EmbedModal` so reels and
 * in-article video embeds render through one implementation (same framing, same
 * control bar, same fullscreen behaviour on mobile).
 *
 * Uses the broader `parseEmbed` (not the reels-restricted variant) so Vimeo and
 * anything else the article parser understands also plays in-app. Unsupported
 * URLs still open the modal — the shared `EmbedModal` shows a "Watch on
 * original site" fallback rather than kicking the reader out to another tab.
 */
export function VideoModal({ reel, onClose }: VideoModalProps) {
  const embed = reel ? parseEmbed(reel.externalUrl) : null;
  const canEmbed = embed?.platform !== "link-card" ? embed?.embedUrl ?? undefined : undefined;

  return (
    <EmbedModal
      open={Boolean(reel)}
      onClose={onClose}
      embedUrl={canEmbed}
      externalUrl={reel?.externalUrl ?? "#"}
      title={reel?.title ?? "Video"}
      platform={embed?.platform}
      aspectRatio={embed?.aspectRatio}
    />
  );
}

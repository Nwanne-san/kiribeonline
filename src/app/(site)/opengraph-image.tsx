import { ImageResponse } from "next/og";
import { getHomepageForPublic } from "@/lib/content";
import { resolveOgImageUrl } from "@/lib/storage/media-url";
import {
  brandedOgCard,
  MUSTARD,
  OG_CONTENT_TYPE,
  OG_SIZE,
} from "@/lib/seo/branded-og-card";
import { toAbsoluteUrl } from "@/lib/seo/site-url";
import { streamMedia } from "@/lib/seo/stream-og-media";

/**
 * Homepage social card. Prefers the hero article's og-size image (so the
 * home preview mirrors what a reader would see clicking through), falls back
 * to the branded card when the hero has no image or the query fails.
 */

export const alt = "Kiribé Online — premium editorial";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

type OgMedia = {
  url?: string | null;
  filename?: string | null;
  sizes?: Record<string, { url?: string | null; filename?: string | null } | null | undefined> | null;
};

export default async function OpengraphImage() {
  let heroImage: OgMedia | undefined;
  try {
    const data = await getHomepageForPublic();
    const raw = data.heroArticle?.heroImage as OgMedia | string | null | undefined;
    if (raw && typeof raw === "object") heroImage = raw;
  } catch (err) {
    console.error("[opengraph-image:home] hero fetch failed, using branded fallback", err);
  }

  // Proxy the bytes rather than redirecting — scrapers that ignore 307s on
  // `og:image` would otherwise render no preview at all. See `streamMedia`.
  const mediaUrl = resolveOgImageUrl(heroImage);
  if (mediaUrl) {
    const proxied = await streamMedia(toAbsoluteUrl(mediaUrl));
    if (proxied) return proxied;
  }

  return new ImageResponse(
    brandedOgCard({
      kicker: "Kiribé Online",
      title: "Premium editorial. Film, television, and the cultural conversations that matter.",
      accentColor: MUSTARD,
      showMark: true,
    }),
    size
  );
}

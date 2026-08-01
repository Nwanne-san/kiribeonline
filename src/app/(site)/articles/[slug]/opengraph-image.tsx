import { ImageResponse } from "next/og";
import { queryArticleBySlug } from "@/lib/content";
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
 * Dynamic Open Graph image for article shares.
 *
 * This file-based convention is the single source of truth for an article's
 * `og:image` (file-based metadata overrides `generateMetadata` in Next.js), so
 * it implements the full fallback chain:
 *
 *   1. `seo.ogImage` (og size variant, 1200×630) → media bytes, streamed
 *   2. `heroImage`   (og size variant, 1200×630) → media bytes, streamed
 *   3. branded card  → rendered with the shared `brandedOgCard` (category accent)
 *
 * Tiers 1–2 proxy the bytes rather than 307-ing to R2. The redirect is correct
 * HTTP, but several major scrapers (X, LinkedIn, WhatsApp, Slack) don't follow
 * redirects on `og:image` and drop the preview entirely — which is why articles
 * with perfectly good artwork showed no social image. Serving from this origin
 * works everywhere, and the response is immutable so the CDN absorbs the hop.
 */

export const alt = "Kiribé Online — article social card";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

type OgMedia = {
  url?: string | null;
  filename?: string | null;
  sizes?: Record<string, { url?: string | null; filename?: string | null } | null | undefined> | null;
};

type OgArticleDoc = {
  title?: string | null;
  heroImage?: OgMedia | string | null;
  seo?: { ogImage?: OgMedia | string | null } | null;
  categories?: Array<{ name?: string | null; brandColor?: string | null } | string> | null;
};

/** Only populated media docs (depth ≥ 1) carry size variants worth resolving. */
function asMedia(value: OgMedia | string | null | undefined): OgMedia | undefined {
  return value && typeof value === "object" ? value : undefined;
}

type PageParams = { params: Promise<{ slug: string }> };

export default async function OpengraphImage({ params }: PageParams) {
  const { slug } = await params;

  // Best-effort: a DB hiccup falls through to the branded tier-3 card rather
  // than serving a broken image to social scrapers.
  let doc: OgArticleDoc | null = null;
  try {
    doc = (await queryArticleBySlug(slug)) as OgArticleDoc | null;
  } catch (err) {
    console.error("[opengraph-image] failed to load article, using branded fallback", err);
  }

  // Tiers 1 & 2 — real artwork wins.
  const mediaUrl =
    resolveOgImageUrl(asMedia(doc?.seo?.ogImage)) ?? resolveOgImageUrl(asMedia(doc?.heroImage));

  if (mediaUrl) {
    const proxied = await streamMedia(toAbsoluteUrl(mediaUrl));
    if (proxied) return proxied;
    // Unreachable or non-image upstream — fall through to the branded card so
    // the share still gets an image rather than nothing.
  }

  // Tier 3 — branded fallback card with the primary category's accent color.
  const title = doc?.title ?? "Kiribé Online";
  const primaryCategory = doc?.categories?.find(
    (category): category is { name?: string | null; brandColor?: string | null } =>
      typeof category === "object" && category !== null
  );
  const accent = primaryCategory?.brandColor || MUSTARD;
  const kicker = primaryCategory?.name?.toUpperCase() ?? "KIRIBÉ EDITORIAL";

  return new ImageResponse(
    brandedOgCard({ kicker, title, accentColor: accent, showMark: true }),
    size
  );
}

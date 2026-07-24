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

/**
 * Dynamic Open Graph image for article shares.
 *
 * This file-based convention is the single source of truth for an article's
 * `og:image` (file-based metadata overrides `generateMetadata` in Next.js), so
 * it implements the full fallback chain:
 *
 *   1. `seo.ogImage` (og size variant, 1200×630) → 307 redirect to the media URL
 *   2. `heroImage`   (og size variant, 1200×630) → 307 redirect to the media URL
 *   3. branded card  → rendered with the shared `brandedOgCard` (category accent)
 *
 * No external requests are made (no remote fonts/assets); tiers 1–2 redirect to
 * the already-hosted media and tier 3 renders from inline styles only.
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

  // Tiers 1 & 2 — real artwork wins. Redirect to the hosted og-size media so the
  // social card uses the actual image without proxying bytes through this route.
  const mediaUrl =
    resolveOgImageUrl(asMedia(doc?.seo?.ogImage)) ?? resolveOgImageUrl(asMedia(doc?.heroImage));

  if (mediaUrl) {
    return Response.redirect(toAbsoluteUrl(mediaUrl), 307);
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
    brandedOgCard({ kicker, title, accentColor: accent }),
    size
  );
}

import { ImageResponse } from "next/og";
import { queryArticleBySlug } from "@/lib/content";
import { resolveOgImageUrl } from "@/lib/storage/media-url";
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
 *   3. branded card  → rendered here with cream/burgundy brand styling
 *
 * No external requests are made (no remote fonts/assets); tiers 1–2 redirect to
 * the already-hosted media and tier 3 renders from inline styles only.
 */

export const alt = "Kiribé Online — article social card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CREAM = "#faf8f5";
const BURGUNDY = "#6b1d2a";
const MUSTARD = "#c9a227";
const INK = "#1a1a1a";

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

  // Tier 3 — branded fallback card.
  const title = doc?.title ?? "Kiribé Online";
  const primaryCategory = doc?.categories?.find(
    (category): category is { name?: string | null; brandColor?: string | null } =>
      typeof category === "object" && category !== null
  );
  const accent = primaryCategory?.brandColor || MUSTARD;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: CREAM,
          padding: "72px 80px",
        }}
      >
        {/* Accent bar in the category colour */}
        <div style={{ display: "flex", height: 12, width: 200, backgroundColor: accent }} />

        {/* Article title */}
        <div
          style={{
            display: "flex",
            fontSize: title.length > 80 ? 60 : 76,
            fontWeight: 700,
            lineHeight: 1.1,
            color: INK,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>

        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: 4,
              color: BURGUNDY,
            }}
          >
            KIRIBÉ
          </div>
        </div>
      </div>
    ),
    size
  );
}

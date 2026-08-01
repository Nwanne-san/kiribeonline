import { ImageResponse } from "next/og";
import { getCategoriesForPublic } from "@/lib/content";
import {
  brandedOgCard,
  MUSTARD,
  OG_CONTENT_TYPE,
  OG_SIZE,
} from "@/lib/seo/branded-og-card";

/**
 * Per-category social card. Uses the category's brand color as the accent
 * bar and matches the copy of the archive hero. Two special-cased slugs
 * (spotlight, videos) carry their own kicker/title/subtitle so the OG
 * mirrors what actually renders on those pages.
 */

export const alt = "Kiribé Online — category";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

type PageParams = { params: Promise<{ slug: string }> };

type SpecialConfig = {
  kicker: string;
  title: string;
  accent: string;
};

const SPECIAL_CASES: Record<string, SpecialConfig> = {
  spotlight: {
    kicker: "Kiribé Spotlight",
    title: "Profiles of the directors, actors, and creatives defining contemporary culture.",
    accent: "#6E11B0",
  },
  videos: {
    kicker: "Kiribé Videos",
    title: "Short-form reels, interviews, and visual features from the Kiribé desk.",
    accent: "#6B1D2A",
  },
};

export default async function OpengraphImage({ params }: PageParams) {
  const { slug } = await params;
  const special = SPECIAL_CASES[slug];

  if (special) {
    return new ImageResponse(
      brandedOgCard({
        kicker: special.kicker,
        title: special.title,
        accentColor: special.accent,
        showMark: true,
      }),
      size
    );
  }

  let name = slug.replace(/-/g, " ");
  let accent = MUSTARD;
  try {
    const categories = await getCategoriesForPublic();
    const category = categories.find((item) => item.slug === slug);
    if (category) {
      name = category.name;
      accent = (category as { brandColor?: string | null }).brandColor || MUSTARD;
    }
  } catch (err) {
    console.error("[opengraph-image:category] category fetch failed, using slug", err);
  }

  return new ImageResponse(
    brandedOgCard({
      kicker: `${name} Category`.toUpperCase(),
      title: `Browse ${name} on Kiribé Online.`,
      accentColor: accent,
      showMark: true,
    }),
    size
  );
}

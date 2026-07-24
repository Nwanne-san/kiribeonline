import { ImageResponse } from "next/og";
import { getTagBySlug } from "@/lib/content";
import {
  brandedOgCard,
  MUSTARD,
  OG_CONTENT_TYPE,
  OG_SIZE,
} from "@/lib/seo/branded-og-card";

/**
 * Per-tag social card. Tags are much finer-grained than categories, so we
 * don't fetch related articles — the branded card with the tag name is
 * enough for share previews.
 */

export const alt = "Kiribé Online — tag";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

type PageParams = { params: Promise<{ slug: string }> };

export default async function OpengraphImage({ params }: PageParams) {
  const { slug } = await params;

  let name = slug.replace(/-/g, " ");
  let accent = MUSTARD;
  try {
    const tag = await getTagBySlug(slug);
    if (tag) {
      name = tag.name;
      accent = (tag as { brandColor?: string | null }).brandColor || MUSTARD;
    }
  } catch (err) {
    console.error("[opengraph-image:tag] tag fetch failed, using slug", err);
  }

  return new ImageResponse(
    brandedOgCard({
      kicker: "Kiribé Tag",
      title: `#${name}`,
      accentColor: accent,
      subtitle: "Every article tagged with this topic",
    }),
    size
  );
}

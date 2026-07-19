"use client";

import Box from "@mui/material/Box";
import {
  RichText,
  type JSXConvertersFunction,
} from "@payloadcms/richtext-lexical/react";
import { KiribeImage } from "@/modules/shared/components/media/KiribeImage";
import type { MediaAsset } from "@/modules/shared/types/content";

export type RichTextRendererProps = {
  // Payload Lexical serialized state
  content?: Record<string, unknown> | null;
  className?: string;
};

/** Shape of a populated `media` upload node value inside Lexical JSON. */
type UploadMediaValue = {
  id?: string | number;
  url?: string | null;
  alt?: string | null;
  caption?: string | null;
  credit?: string | null;
  width?: number | null;
  height?: number | null;
  blurDataUrl?: string | null;
  sizes?: MediaAsset["sizes"];
};

/** Adapt a raw Payload media doc into the `MediaAsset` KiribeImage expects. */
function toMediaAsset(value: UploadMediaValue): MediaAsset | null {
  if (!value.url) return null;
  return {
    id: String(value.id ?? value.url),
    url: value.url,
    alt: value.alt ?? undefined,
    caption: value.caption ?? undefined,
    credit: value.credit ?? undefined,
    width: value.width ?? undefined,
    height: value.height ?? undefined,
    blurDataUrl: value.blurDataUrl ?? undefined,
    sizes: value.sizes,
  };
}

/**
 * Render `upload` (media) nodes through KiribeImage/next-image — lazy-loaded,
 * intrinsically sized, blur-up — instead of Lexical's default raw `<img>`.
 * This is also the seam PLAN-EMBEDS extends for other embed node types.
 */
const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  upload: ({ node }) => {
    // Only handle media uploads; defer anything else to the default renderer.
    // `node.value` is only a populated object when the article was queried at a
    // depth that resolves upload nodes (detail page uses depth ≥ 2). At lower
    // depth it's a bare id — we skip rather than render a broken image.
    if (node.relationTo !== "media" || typeof node.value !== "object" || node.value === null) {
      return null;
    }
    const media = toMediaAsset(node.value as UploadMediaValue);
    if (!media) return null;

    const alt = media.alt ?? "";
    const hasDimensions = Boolean(media.width && media.height);
    // Inline images intentionally use the (2560px-capped) original rather than
    // a size variant: every generated variant is a fixed-aspect cover crop,
    // which would clip arbitrary-aspect editorial photos. next/image still
    // serves right-sized output per the `sizes` attr.

    return (
      <Box component="figure" sx={{ my: 3, mx: 0 }}>
        {hasDimensions ? (
          <KiribeImage
            src={media}
            alt={alt}
            width={media.width}
            height={media.height}
            sizes="(max-width: 768px) 100vw, 768px"
            loading="lazy"
            style={{ width: "100%", height: "auto", borderRadius: 8 }}
          />
        ) : (
          <KiribeImage
            src={media}
            alt={alt}
            aspect="card"
            loading="lazy"
            style={{ borderRadius: 8 }}
          />
        )}
        {media.caption || media.credit ? (
          <Box
            component="figcaption"
            sx={{ mt: 1, fontSize: "0.8125rem", color: "text.secondary" }}
          >
            {media.caption}
            {media.caption && media.credit ? " · " : ""}
            {media.credit ? <em>{media.credit}</em> : null}
          </Box>
        ) : null}
      </Box>
    );
  },
});

/** Render Payload Lexical JSON for article bodies. */
export function RichTextRenderer({ content, className }: RichTextRendererProps) {
  if (!content) return null;

  return (
    <Box
      className={className}
      sx={{
        "& p": { mb: 2, lineHeight: 1.7 },
        "& h2, & h3": { mt: 3, mb: 1.5, fontFamily: "var(--font-headline)" },
        "& a": { color: "primary.main", textDecoration: "underline" },
        "& img": { maxWidth: "100%", height: "auto", borderRadius: 1 },
        "& figure": { maxWidth: "100%" },
      }}
    >
      <RichText data={content as never} converters={converters} />
    </Box>
  );
}

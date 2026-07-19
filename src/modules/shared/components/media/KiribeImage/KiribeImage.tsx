"use client";

import Box from "@mui/material/Box";
import Image, { type ImageProps } from "next/image";
import { resolveMediaUrl } from "@/lib/storage/media-url";
import type { MediaAsset, MediaSizeName } from "@/modules/shared/types/content";

export type KiribeImageAspect = "hero" | "card" | "thumb" | "square";

/**
 * Accepted `src` shapes, in order of richness:
 *  - a plain URL string (legacy callers)
 *  - a minimal `{ url, filename }` object (legacy Payload doc)
 *  - a full `MediaAsset` with responsive `sizes` + `blurDataUrl`
 */
export type KiribeImageSource =
  | string
  | { url?: string | null; filename?: string | null }
  | MediaAsset
  | null;

export type KiribeImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: KiribeImageSource;
  alt: string;
  aspect?: KiribeImageAspect;
  fill?: boolean;
};

const aspectRatios: Record<KiribeImageAspect, string> = {
  hero: "56.25%",
  card: "62.5%",
  thumb: "75%",
  square: "100%",
};

/** Which pre-generated variant best serves each display aspect. */
const aspectVariant: Record<KiribeImageAspect, MediaSizeName> = {
  hero: "wide",
  card: "card",
  thumb: "thumbnail",
  square: "card",
};

function isMediaAsset(src: KiribeImageSource): src is MediaAsset {
  return typeof src === "object" && src !== null && "id" in src;
}

/**
 * Resolve the URL to render plus an optional blur placeholder. When the source
 * is a full `MediaAsset` we prefer the aspect-matched variant so we don't ship a
 * 2560px original into a thumbnail slot, and surface its `blurDataUrl`.
 */
function resolveSource(
  src: KiribeImageSource,
  aspect?: KiribeImageAspect
): { url?: string; blurDataURL?: string } {
  if (isMediaAsset(src)) {
    const variant = aspect ? src.sizes?.[aspectVariant[aspect]] : undefined;
    return {
      url: variant?.url ?? resolveMediaUrl(src),
      blurDataURL: src.blurDataUrl,
    };
  }
  return { url: resolveMediaUrl(src) };
}

/** Editorial image with R2 URL resolution, responsive variants, blur-up, and
 *  required alt text. Backward-compatible with URL-only callers. */
export function KiribeImage({
  src,
  alt,
  aspect,
  fill,
  style,
  sizes,
  priority,
  className,
  placeholder,
  blurDataURL,
  ...props
}: KiribeImageProps) {
  const { url: resolved, blurDataURL: docBlur } = resolveSource(src ?? null, aspect);

  if (!resolved) {
    return (
      <Box
        sx={{
          bgcolor: "action.hover",
          width: "100%",
          ...(aspect && !fill ? { pt: aspectRatios[aspect] } : { minHeight: 120 }),
        }}
        aria-label={alt}
      />
    );
  }

  // Blur-up when an LQIP is available (from the doc or caller) and blur isn't
  // opted out of. next/image requires blurDataURL alongside placeholder="blur"
  // for remote images, so only enable it when we actually have the data URI.
  const effectiveBlur = blurDataURL ?? docBlur;
  const placeholderProps: Pick<ImageProps, "placeholder" | "blurDataURL"> =
    effectiveBlur && placeholder !== "empty"
      ? { placeholder: "blur", blurDataURL: effectiveBlur }
      : placeholder
        ? { placeholder }
        : {};

  if (fill || aspect) {
    return (
      <Box
        sx={{
          position: "relative",
          width: "100%",
          ...(aspect && !fill ? { pt: aspectRatios[aspect] } : {}),
          overflow: "hidden",
        }}
      >
        <Image
          src={resolved}
          alt={alt}
          fill={fill ?? Boolean(aspect)}
          sizes={sizes ?? (aspect === "hero" ? "100vw" : "(max-width: 768px) 100vw, 33vw")}
          priority={priority}
          style={{
            objectFit: "cover",
            ...style,
          }}
          className={className}
          {...placeholderProps}
          {...props}
        />
      </Box>
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      sizes={sizes}
      priority={priority}
      style={style}
      className={className}
      {...placeholderProps}
      {...props}
    />
  );
}

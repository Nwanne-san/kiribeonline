"use client";

import Box from "@mui/material/Box";
import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { resolveMediaUrl } from "@/lib/storage/media-url";
import type { MediaAsset, MediaSizeName } from "@/modules/shared/types/content";

/**
 * Branded placeholder shown when an image URL fails to load — a broken R2 link,
 * a deleted asset, or a slow-cold-cache miss that the CDN 404s on. Ships as a
 * static SVG so it works even if R2 itself is unreachable.
 */
export const IMAGE_FALLBACK_SRC = "/images/fallback-image.svg";

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

  // Swap in the branded fallback when the CDN 404s on us. Reset when the
  // source URL changes (a fresh image was slotted after a broken one).
  const [errored, setErrored] = useState(false);
  useEffect(() => {
    setErrored(false);
  }, [resolved]);

  if (!resolved) {
    // No URL at all — render the branded fallback rather than a bare grey
    // box, so a hero without a hero image still looks like the site.
    return (
      <FallbackImage
        alt={alt}
        aspect={aspect}
        fill={fill}
        sizes={sizes}
        className={className}
        style={style}
      />
    );
  }

  if (errored) {
    return (
      <FallbackImage
        alt={alt}
        aspect={aspect}
        fill={fill}
        sizes={sizes}
        className={className}
        style={style}
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
  const onError = () => setErrored(true);

  if (fill) {
    // Fill mode relies on the caller's positioned, sized container — adding a
    // wrapper here would have `height: auto` (0px) and collapse the image.
    return (
      <Image
        src={resolved}
        alt={alt}
        fill
        sizes={sizes ?? (aspect === "hero" ? "100vw" : "(max-width: 768px) 100vw, 33vw")}
        priority={priority}
        style={{
          objectFit: "cover",
          ...style,
        }}
        className={className}
        onError={onError}
        {...placeholderProps}
        {...props}
      />
    );
  }

  if (aspect) {
    return (
      <Box
        sx={{
          position: "relative",
          width: "100%",
          pt: aspectRatios[aspect],
          overflow: "hidden",
        }}
      >
        <Image
          src={resolved}
          alt={alt}
          fill
          sizes={sizes ?? (aspect === "hero" ? "100vw" : "(max-width: 768px) 100vw, 33vw")}
          priority={priority}
          style={{
            objectFit: "cover",
            ...style,
          }}
          className={className}
          onError={onError}
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
      onError={onError}
      {...placeholderProps}
      {...props}
    />
  );
}

/**
 * Standalone renderer for the brand fallback. Reused by the no-URL branch and
 * the onError branch of KiribeImage — same visual either way so a broken
 * asset and a missing one both read as the site owning the blank space.
 */
function FallbackImage({
  alt,
  aspect,
  fill,
  sizes,
  className,
  style,
}: {
  alt: string;
  aspect?: KiribeImageAspect;
  fill?: boolean;
  sizes?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (fill) {
    return (
      <Image
        src={IMAGE_FALLBACK_SRC}
        alt={alt}
        fill
        sizes={sizes ?? "100vw"}
        style={{ objectFit: "cover", ...style }}
        className={className}
        unoptimized
      />
    );
  }
  if (aspect) {
    return (
      <Box
        sx={{
          position: "relative",
          width: "100%",
          pt: aspectRatios[aspect],
          overflow: "hidden",
        }}
      >
        <Image
          src={IMAGE_FALLBACK_SRC}
          alt={alt}
          fill
          sizes={sizes ?? "100vw"}
          style={{ objectFit: "cover", ...style }}
          className={className}
          unoptimized
        />
      </Box>
    );
  }
  return (
    <Image
      src={IMAGE_FALLBACK_SRC}
      alt={alt}
      width={800}
      height={600}
      sizes={sizes}
      style={style}
      className={className}
      unoptimized
    />
  );
}

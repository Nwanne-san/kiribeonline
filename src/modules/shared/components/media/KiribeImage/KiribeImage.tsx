"use client";

import Box from "@mui/material/Box";
import Image, { type ImageProps } from "next/image";
import { resolveMediaUrl } from "@/lib/storage/media-url";

export type KiribeImageAspect = "hero" | "card" | "thumb" | "square";

export type KiribeImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string | { url?: string | null; filename?: string | null } | null;
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

/** Editorial image with R2 URL resolution and required alt text. */
export function KiribeImage({
  src,
  alt,
  aspect,
  fill,
  style,
  sizes,
  priority,
  className,
  ...props
}: KiribeImageProps) {
  const resolved = resolveMediaUrl(src);

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
      {...props}
    />
  );
}

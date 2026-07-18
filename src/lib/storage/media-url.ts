import { getR2PublicBaseUrl } from "@/lib/storage/r2";

/**
 * Resolve a media URL from Payload media object, R2 path, or absolute URL.
 */
export function resolveMediaUrl(
  source?: string | { url?: string | null; filename?: string | null } | null
): string | undefined {
  if (!source) return undefined;

  if (typeof source === "string") {
    if (source.startsWith("http://") || source.startsWith("https://")) {
      return source;
    }
    const base = getR2PublicBaseUrl();
    if (base) {
      return `${base.replace(/\/$/, "")}/${source.replace(/^\//, "")}`;
    }
    return source.startsWith("/") ? source : `/${source}`;
  }

  if (source.url) {
    if (source.url.startsWith("http")) return source.url;
    const base = getR2PublicBaseUrl();
    if (base) {
      return `${base.replace(/\/$/, "")}/${source.url.replace(/^\//, "")}`;
    }
    return source.url;
  }

  if (source.filename) {
    const base = getR2PublicBaseUrl();
    if (base) {
      return `${base.replace(/\/$/, "")}/${source.filename}`;
    }
  }

  return undefined;
}

/** A single Payload image-size variant (thumbnail/card/wide/og). */
type MediaSizeVariant = { url?: string | null; filename?: string | null };

/** Minimal shape of a Payload media doc that carries size variants. */
type MediaWithSizes = {
  url?: string | null;
  filename?: string | null;
  sizes?: Partial<Record<string, MediaSizeVariant | null | undefined>> | null;
};

/**
 * Resolve a media URL for a specific Payload image-size variant (e.g. `og`,
 * `wide`), falling back to the original file when the variant is absent.
 *
 * Payload only generates a size variant when the source image is at least as
 * large as the target, so smaller uploads legitimately have no `og` size — in
 * that case the full-size URL is returned rather than nothing.
 */
export function resolveMediaSizeUrl(
  source: MediaWithSizes | string | null | undefined,
  size: string
): string | undefined {
  if (!source || typeof source === "string") {
    return resolveMediaUrl(source ?? undefined);
  }

  const variant = source.sizes?.[size];
  if (variant && (variant.url || variant.filename)) {
    const resolved = resolveMediaUrl({
      url: variant.url ?? undefined,
      filename: variant.filename ?? undefined,
    });
    if (resolved) return resolved;
  }

  return resolveMediaUrl(source);
}

/**
 * Resolve the 1200×630 social-card (`og`) variant of a media doc, falling back
 * to the original file. Convenience wrapper over {@link resolveMediaSizeUrl}.
 */
export function resolveOgImageUrl(
  source: MediaWithSizes | string | null | undefined
): string | undefined {
  return resolveMediaSizeUrl(source, "og");
}

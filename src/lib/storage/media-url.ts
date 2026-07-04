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

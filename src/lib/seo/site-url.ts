/**
 * Canonical public origin for the site.
 *
 * Used for `metadataBase`, absolute OG image URLs, the sitemap, and robots.
 * Reads `NEXT_PUBLIC_APP_URL` (see `.env.example`) and falls back to localhost
 * in local dev when the var is unset. Never has a trailing slash.
 */
export function getSiteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Resolve a (possibly relative) URL against the site origin so it is safe to
 * use in metadata, redirects, and OG images that require an absolute URL.
 */
export function toAbsoluteUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${getSiteBaseUrl()}/${url.replace(/^\//, "")}`;
}

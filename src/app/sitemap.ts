import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { getSitemapEntries } from "@/services/cron.service";

/**
 * Public sitemap served at `/sitemap.xml`. Mirrors the cron-generated sitemap
 * (`/api/cron/sitemap`, which is auth-gated) but is crawlable and referenced by
 * `robots.txt`.
 *
 * `force-dynamic` keeps this off the build-time prerender path so the build
 * never needs a live database (matching the dynamic cron route). To avoid a
 * `find({ limit: 1000 })` on every crawl, the entry list is served from the
 * Data Cache and revalidated hourly (busted on the `articles` tag when content
 * changes), so most requests never touch the database.
 */
export const dynamic = "force-dynamic";

const getCachedSitemapEntries = unstable_cache(getSitemapEntries, ["public-sitemap"], {
  tags: ["articles"],
  revalidate: 3600,
});

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getCachedSitemapEntries();
  return entries.map(({ url, lastModified }) => ({
    url,
    lastModified: lastModified ? new Date(lastModified) : undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
}

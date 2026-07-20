import { unstable_cache } from "next/cache";
import { getFeedItems, type FeedItem } from "@/lib/content/query-feed";
import { getSiteBaseUrl } from "@/lib/seo/site-url";

/**
 * Public RSS 2.0 feed served at `/feed.xml`.
 *
 * Mirrors the sitemap's data-cache posture: `force-dynamic` keeps the route
 * off the build-time prerender path (so a build never needs a live DB) and
 * the payload is memoised via `unstable_cache` on the `articles` tag so most
 * requests never hit Payload. Content is a summary feed by design — title,
 * link, pubDate, category, and the excerpt — never the full article body.
 */
export const dynamic = "force-dynamic";

const SITE_NAME = "Kiribé Online";
const FEED_DESCRIPTION =
  "Latest articles from Kiribé Online — premium editorial on film, television, opinion, news, and spotlight features.";

const getCachedFeedItems = unstable_cache(getFeedItems, ["public-rss-feed"], {
  tags: ["articles"],
  revalidate: 3600,
});

/**
 * XML 1.0 disallows most C0 control characters anywhere in a document
 * (0x00–0x08, 0x0B, 0x0C, 0x0E–0x1F). Tab (0x09), LF (0x0A) and CR (0x0D)
 * stay so multi-line excerpts render intact. Using a per-char filter with
 * explicit codepoint checks keeps this source file free of embedded
 * control bytes.
 */
function stripInvalidXmlControlChars(value: string): string {
  let out = "";
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    const allowedControl = code === 0x09 || code === 0x0a || code === 0x0d;
    if (code < 0x20 && !allowedControl) continue;
    out += value[i];
  }
  return out;
}

/**
 * Escape a value for inclusion in XML character data. Covers the five XML
 * predefined entities and strips control characters that would otherwise
 * render the feed invalid.
 */
function escapeXml(value: string): string {
  return stripInvalidXmlControlChars(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** RFC 822 date required by RSS 2.0 `<pubDate>`. */
function toRfc822(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toUTCString();
}

function renderItem(item: FeedItem): string {
  const parts: string[] = [];
  parts.push("<item>");
  parts.push(`<title>${escapeXml(item.title)}</title>`);
  parts.push(`<link>${escapeXml(item.url)}</link>`);
  // Use the canonical article URL as a permalink-style guid so aggregators
  // dedupe on the article, not on a random uuid.
  parts.push(`<guid isPermaLink="true">${escapeXml(item.url)}</guid>`);
  const pubDate = toRfc822(item.publishedAt);
  if (pubDate) parts.push(`<pubDate>${pubDate}</pubDate>`);
  if (item.categoryName) {
    parts.push(`<category>${escapeXml(item.categoryName)}</category>`);
  }
  if (item.description) {
    parts.push(`<description>${escapeXml(item.description)}</description>`);
  }
  parts.push("</item>");
  return parts.join("");
}

function renderFeed(items: FeedItem[]): string {
  const baseUrl = getSiteBaseUrl();
  const feedUrl = `${baseUrl}/feed.xml`;
  const lastBuildDate = new Date().toUTCString();

  const channel: string[] = [];
  channel.push(`<title>${escapeXml(SITE_NAME)}</title>`);
  channel.push(`<link>${escapeXml(baseUrl)}</link>`);
  channel.push(`<description>${escapeXml(FEED_DESCRIPTION)}</description>`);
  channel.push(`<language>en-US</language>`);
  channel.push(`<lastBuildDate>${lastBuildDate}</lastBuildDate>`);
  channel.push(
    `<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`
  );
  channel.push(items.map(renderItem).join(""));

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">` +
    `<channel>${channel.join("")}</channel>` +
    `</rss>`
  );
}

export async function GET() {
  const items = await getCachedFeedItems();
  const xml = renderFeed(items);
  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      // Aggregators (Feedly, Inoreader, …) cache the feed themselves; a short
      // s-maxage keeps CDN pressure low while still refreshing every hour.
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

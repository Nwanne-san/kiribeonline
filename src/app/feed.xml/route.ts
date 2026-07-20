import { unstable_cache } from "next/cache";
import { getSiteSettingsForPublic, queryArticlesForFeed } from "@/lib/content";
import type { FeedArticle } from "@/lib/content";
import { getSiteBaseUrl } from "@/lib/seo/site-url";
import { publicRoute } from "@/modules/shared/components/ui";
import { PublicRoutes } from "@/routes/public.routes";

/**
 * Public RSS 2.0 feed served at `/feed.xml`.
 *
 * Emits a discovery-style summary — title, canonical link, category, and the
 * editorial excerpt (never the full Lexical body) — so readers who subscribe
 * still visit the site to read the piece. Mirrors the sitemap's runtime
 * posture (`force-dynamic` + `unstable_cache` tagged `articles`) so the build
 * never touches the DB and most requests hit the Data Cache.
 */
export const dynamic = "force-dynamic";

const FEED_LIMIT = 30;

const getCachedFeedArticles = unstable_cache(
  () => queryArticlesForFeed(FEED_LIMIT),
  ["public-feed-articles"],
  { tags: ["articles"], revalidate: 3600 }
);

/**
 * Escape a string for safe placement inside an XML text node or attribute.
 * Covers the five XML predefined entities — sufficient for RSS text content
 * (we wrap `<title>` / `<description>` in CDATA below where markup is more
 * likely to appear).
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Wrap free-form text in CDATA. The RSS spec allows raw markup inside
 * `<title>` / `<description>` / `<category>` if wrapped this way; the only
 * illegal sequence inside CDATA is the closing `]]>`, which we split with an
 * entity so it can't terminate the section early.
 */
function cdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

function articleUrl(baseUrl: string, article: FeedArticle): string {
  return `${baseUrl}${publicRoute(PublicRoutes.articleDetail, { slug: article.slug })}`;
}

function buildRssXml(
  articles: FeedArticle[],
  meta: { siteName: string; description: string; baseUrl: string; buildDate: string; feedUrl: string }
): string {
  const items = articles
    .map((article) => {
      const link = escapeXml(articleUrl(meta.baseUrl, article));
      const pubDate = article.publishedAt
        ? new Date(article.publishedAt).toUTCString()
        : new Date().toUTCString();
      const description = article.excerpt?.trim() || article.title;
      const category = article.primaryCategory?.name
        ? `<category>${cdata(article.primaryCategory.name)}</category>`
        : "";

      return [
        "<item>",
        `<title>${cdata(article.title)}</title>`,
        `<link>${link}</link>`,
        `<guid isPermaLink="true">${link}</guid>`,
        `<pubDate>${pubDate}</pubDate>`,
        category,
        `<description>${cdata(description)}</description>`,
        "</item>",
      ]
        .filter(Boolean)
        .join("");
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${cdata(
    meta.siteName
  )}</title><link>${escapeXml(meta.baseUrl)}</link><atom:link href="${escapeXml(
    meta.feedUrl
  )}" rel="self" type="application/rss+xml"/><description>${cdata(
    meta.description
  )}</description><language>en-us</language><lastBuildDate>${meta.buildDate}</lastBuildDate>${items}</channel></rss>`;
}

const DEFAULT_DESCRIPTION =
  "Premium editorial and entertainment — film, television, opinion, news, and spotlight features.";

export async function GET() {
  const baseUrl = getSiteBaseUrl();
  const [articles, settings] = await Promise.all([
    getCachedFeedArticles(),
    getSiteSettingsForPublic().catch(() => ({
      siteName: "Kiribé Online",
      seoDefaults: undefined,
    })),
  ]);

  const siteName = settings.siteName?.trim() || "Kiribé Online";
  const description = settings.seoDefaults?.description?.trim() || DEFAULT_DESCRIPTION;
  // Match `lastBuildDate` to the most recent article so the value is
  // meaningful (and stable across cached renders) rather than "now".
  const buildDate = articles[0]?.publishedAt
    ? new Date(articles[0].publishedAt).toUTCString()
    : new Date().toUTCString();

  const xml = buildRssXml(articles, {
    siteName,
    description,
    baseUrl,
    buildDate,
    feedUrl: `${baseUrl}/feed.xml`,
  });

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      // Route response cache — the feed only rebuilds when the `articles`
      // tag is revalidated (matches the sitemap posture).
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

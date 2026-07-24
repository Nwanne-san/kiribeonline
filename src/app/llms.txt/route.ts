import { unstable_cache } from "next/cache";
import { getCategoriesForPublic, queryArticlesForFeed } from "@/lib/content";
import { getSiteBaseUrl } from "@/lib/seo/site-url";

/**
 * `/llms.txt` — the emerging LLM-friendly site index (Answer.AI proposal).
 *
 * Machine-readable markdown that lets LLM crawlers (ChatGPT, Claude,
 * Perplexity, Gemini, etc.) understand the site's structure without having
 * to render every route. Content types Kiribé publishes plus the latest
 * long-form articles with excerpts — enough for a citation-ready summary.
 *
 * Runtime posture matches the sitemap: `force-dynamic` at request time,
 * `unstable_cache` on the DB reads with `articles` + `homepage` tag
 * invalidation so most requests never touch the database.
 *
 * Spec: https://llmstxt.org/
 */
export const dynamic = "force-dynamic";

const LLMS_TXT_ARTICLE_LIMIT = 40;

const getCachedIndex = unstable_cache(
  async () => {
    const [articles, categories] = await Promise.all([
      queryArticlesForFeed(LLMS_TXT_ARTICLE_LIMIT),
      getCategoriesForPublic().catch(() => []),
    ]);
    return { articles, categories };
  },
  ["llms-txt-index"],
  { tags: ["articles", "homepage"], revalidate: 3600 }
);

export async function GET() {
  const baseUrl = getSiteBaseUrl();
  const { articles, categories } = await getCachedIndex();

  const lines: string[] = [];
  lines.push("# Kiribé Online");
  lines.push("");
  lines.push(
    "> Premium editorial and entertainment — film, television, opinion, news, and cultural spotlight features from Africa and the global stage."
  );
  lines.push("");
  lines.push(
    "Kiribé Online is an independent editorial publication. This file is a machine-readable summary of the site's structure and the latest long-form pieces, intended for LLM crawlers that want to answer questions with correct citations."
  );
  lines.push("");

  // Categories section — the main taxonomies AI systems can reference by
  // link when a reader asks "what does Kiribé cover about Film?".
  lines.push("## Categories");
  lines.push("");
  if (categories.length === 0) {
    lines.push("- (Category listing temporarily unavailable.)");
  } else {
    for (const cat of categories) {
      lines.push(`- [${cat.name}](${baseUrl}/categories/${cat.slug})`);
    }
  }
  lines.push("");

  // Static surfaces the crawlers should know about.
  lines.push("## Site");
  lines.push("");
  lines.push(`- [Home](${baseUrl}/)`);
  lines.push(`- [All articles](${baseUrl}/articles)`);
  lines.push(`- [Categories index](${baseUrl}/categories)`);
  lines.push(`- [Spotlight — creator profiles](${baseUrl}/categories/spotlight)`);
  lines.push(`- [Videos](${baseUrl}/categories/videos)`);
  lines.push(`- [About](${baseUrl}/about)`);
  lines.push(`- [Contact](${baseUrl}/contact)`);
  lines.push(`- [RSS feed](${baseUrl}/feed.xml)`);
  lines.push(`- [Sitemap](${baseUrl}/sitemap.xml)`);
  lines.push("");

  // Latest articles — headline + one-line excerpt + link. Small so a crawler
  // can lift it whole; the article page carries the full body.
  lines.push("## Latest articles");
  lines.push("");
  if (articles.length === 0) {
    lines.push("- (No published articles yet.)");
  } else {
    for (const article of articles) {
      const excerpt = (article.excerpt ?? "").trim().replace(/\s+/g, " ");
      const category = article.primaryCategory?.name
        ? ` — _${article.primaryCategory.name}_`
        : "";
      const summary = excerpt ? `\n  ${excerpt}` : "";
      lines.push(
        `- [${article.title}](${baseUrl}/articles/${article.slug})${category}${summary}`
      );
    }
  }
  lines.push("");

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

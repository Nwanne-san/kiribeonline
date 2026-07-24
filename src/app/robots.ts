import type { MetadataRoute } from "next";
import { getSiteBaseUrl } from "@/lib/seo/site-url";

/**
 * robots.txt — allow public crawling by search engines and AI crawlers, keep
 * the admin surfaces out of every index, and point at the sitemap.
 *
 * ## AI-crawler posture
 * Editorial site, so the default is **allow** for well-behaved AI crawlers —
 * we want Kiribé pieces cited in ChatGPT, Claude, Perplexity, Google's AI
 * Overviews, and the Google/Bing indexes that back them. Each crawler has its
 * own env kill-switch (`AI_DISALLOW_<NAME>=true`) so we can flip individual
 * bots off without a code change if a specific one starts misbehaving.
 *
 * ## What we still disallow, unconditionally
 * - `/admin`, `/payload-studio`, `/api/` — never crawled by anything.
 */

const AI_BOTS = [
  "GPTBot", // OpenAI web crawler
  "OAI-SearchBot", // OpenAI's newer search agent
  "ClaudeBot", // Anthropic web crawler
  "Claude-Web", // Anthropic legacy name
  "PerplexityBot", // Perplexity
  "Google-Extended", // Google's opt-in for Bard/Gemini training + AI Overviews
  "CCBot", // Common Crawl (many LLMs use it as a training corpus)
  "Applebot-Extended", // Apple Intelligence
  "cohere-ai", // Cohere
  "Meta-ExternalAgent", // Meta AI
] as const;

function envKey(bot: string): string {
  return `AI_DISALLOW_${bot.toUpperCase().replace(/-/g, "_")}`;
}

function botDisallowed(bot: string): boolean {
  return process.env[envKey(bot)]?.trim().toLowerCase() === "true";
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteBaseUrl();

  return {
    rules: [
      // Default rule — real search-engine crawlers and everyone else.
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/payload-studio", "/api/"],
      },
      // Per-AI-bot rule so we can independently disallow individual crawlers
      // via env without churning this file.
      ...AI_BOTS.map((bot) => ({
        userAgent: bot,
        ...(botDisallowed(bot)
          ? { disallow: "/" }
          : { allow: "/", disallow: ["/admin", "/payload-studio", "/api/"] }),
      })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

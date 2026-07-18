import type { MetadataRoute } from "next";
import { getSiteBaseUrl } from "@/lib/seo/site-url";

/**
 * robots.txt — allow public crawling, keep the admin and Payload Studio out of
 * search indexes, and point crawlers at the public sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteBaseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/payload-studio", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

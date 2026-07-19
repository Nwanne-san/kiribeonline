import { revalidateTag } from "next/cache";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { getSiteBaseUrl } from "@/lib/seo/site-url";
import { PublicRoutes } from "@/routes/public.routes";

export type SitemapEntry = {
  url: string;
  lastModified?: string;
};

/**
 * Build the canonical list of public URLs for the sitemap: static marketing
 * routes plus every published article. Shared by the native `/sitemap.xml`
 * route and the cron XML generator so both stay in sync.
 */
export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const baseUrl = getSiteBaseUrl();

  const staticPaths = [
    PublicRoutes.home,
    PublicRoutes.articles,
    PublicRoutes.categories,
    PublicRoutes.about,
    PublicRoutes.contact,
    PublicRoutes.privacy,
    PublicRoutes.terms,
  ];
  const staticEntries: SitemapEntry[] = staticPaths.map((path) => ({
    url: `${baseUrl}${path}`,
  }));

  // Articles are best-effort: a DB outage degrades the sitemap to static routes
  // rather than failing the request (and the static prerender), mirroring the
  // resilience of the other public content queries.
  try {
    const payload = await getPayloadClient();
    const { docs: articles } = await payload.find({
      collection: "articles",
      where: { status: { equals: "published" } },
      limit: 1000,
      overrideAccess: true,
    });

    return [
      ...staticEntries,
      ...articles.map((article) => ({
        url: `${baseUrl}/articles/${article.slug}`,
        lastModified:
          (article.updatedAt as string | undefined) ??
          (article.publishedAt as string | undefined),
      })),
    ];
  } catch (err) {
    console.error("[sitemap] failed to load articles, serving static routes only", err);
    return staticEntries;
  }
}

export async function generateSitemapXml(): Promise<string> {
  const entries = await getSitemapEntries();

  const body = entries
    .map(
      ({ url }) =>
        `<url><loc>${url}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export async function publishScheduledArticles(): Promise<number> {
  const payload = await getPayloadClient();
  const now = new Date().toISOString();

  const { docs } = await payload.find({
    collection: "articles",
    where: {
      and: [
        { status: { equals: "scheduled" } },
        { publishedAt: { less_than_equal: now } },
      ],
    },
    limit: 100,
    overrideAccess: true,
  });

  for (const article of docs) {
    await payload.update({
      collection: "articles",
      id: article.id,
      data: {
        status: "published",
      },
      overrideAccess: true,
    });
  }

  if (docs.length) {
    revalidateTag("articles");
    revalidateTag("homepage");
  }

  return docs.length;
}

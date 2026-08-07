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
    // Special-cased category routes not backed by article-tagged data — must
    // be listed explicitly so crawlers discover them.
    "/categories/spotlight",
    PublicRoutes.categoryVideos,
  ];
  const staticEntries: SitemapEntry[] = staticPaths.map((path) => ({
    url: `${baseUrl}${path}`,
  }));

  // Articles + taxonomy are best-effort: a DB outage degrades the sitemap to
  // static routes rather than failing the request (and the static prerender),
  // mirroring the resilience of the other public content queries.
  try {
    const payload = await getPayloadClient();
    const [articlesRes, categoriesRes, tagsRes, pagesRes] = await Promise.all([
      payload.find({
        collection: "articles",
        where: { status: { equals: "published" } },
        limit: 1000,
        overrideAccess: true,
      }),
      payload.find({
        collection: "categories",
        limit: 200,
        overrideAccess: true,
      }),
      payload.find({
        collection: "tags",
        limit: 500,
        overrideAccess: true,
      }),
      payload.find({
        collection: "pages",
        where: { status: { equals: "published" } },
        limit: 200,
        overrideAccess: true,
      }),
    ]);

    return [
      ...staticEntries,
      ...articlesRes.docs.map((article) => ({
        url: `${baseUrl}/articles/${article.slug}`,
        lastModified:
          (article.updatedAt as string | undefined) ??
          (article.publishedAt as string | undefined),
      })),
      ...categoriesRes.docs.map((cat) => ({
        url: `${baseUrl}/categories/${cat.slug}`,
        lastModified: cat.updatedAt as string | undefined,
      })),
      ...tagsRes.docs.map((tag) => ({
        url: `${baseUrl}/tags/${tag.slug}`,
        lastModified: tag.updatedAt as string | undefined,
      })),
      // Editor-authored CMS pages live at the site root (`/<slug>`).
      ...pagesRes.docs.map((page) => ({
        url: `${baseUrl}/${page.slug}`,
        lastModified:
          (page.updatedAt as string | undefined) ??
          (page.publishedAt as string | undefined),
      })),
    ];
  } catch (err) {
    console.error("[sitemap] failed to load taxonomies, serving static routes only", err);
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

  let promoted = 0;
  for (const article of docs) {
    try {
      // Pass the existing scheduled `publishedAt` back explicitly so the
      // `articleBeforeChange` hook can't reset it to now() in the unlikely
      // case Payload's merged-data behavior shifts under us. The scheduled
      // timestamp is the intended publication moment and must survive
      // promotion untouched.
      await payload.update({
        collection: "articles",
        id: article.id,
        data: {
          status: "published",
          publishedAt: article.publishedAt ?? now,
        },
        overrideAccess: true,
      });
      promoted += 1;
    } catch (err) {
      // A single bad article shouldn't abort the batch — log and move on so
      // the rest still ship, and the next cron tick retries.
      console.error(
        `[cron] failed to publish scheduled article ${article.id}`,
        err
      );
    }
  }

  if (promoted) {
    revalidateTag("articles");
    revalidateTag("homepage");
    console.info(`[cron] promoted ${promoted}/${docs.length} scheduled articles`);
  }

  return promoted;
}

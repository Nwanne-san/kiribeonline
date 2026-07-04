import { revalidateTag } from "next/cache";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { PublicRoutes } from "@/routes/public.routes";

export async function generateSitemapXml(): Promise<string> {
  const payload = await getPayloadClient();
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    ""
  );

  const staticPaths = [
    PublicRoutes.home,
    PublicRoutes.articles,
    PublicRoutes.about,
    PublicRoutes.contact,
    PublicRoutes.privacy,
    PublicRoutes.terms,
  ];

  const { docs: articles } = await payload.find({
    collection: "articles",
    where: { status: { equals: "published" } },
    limit: 1000,
    overrideAccess: true,
  });

  const urls = [
    ...staticPaths.map((path) => `${baseUrl}${path}`),
    ...articles.map((article) => `${baseUrl}/articles/${article.slug}`),
  ];

  const body = urls
    .map(
      (url) =>
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

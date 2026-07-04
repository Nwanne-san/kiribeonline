import { getPayloadClient } from "@/lib/payload/get-payload";
import { listAdminArticles } from "./articles";
import type { DashboardStats } from "./types";

async function countArticles(status?: string): Promise<number> {
  const payload = await getPayloadClient();
  const result = await payload.count({
    collection: "articles",
    where: status ? { status: { equals: status } } : undefined,
    overrideAccess: true,
  });
  return result.totalDocs;
}

async function countCollection(collection: "categories" | "tags" | "media"): Promise<number> {
  const payload = await getPayloadClient();
  const result = await payload.count({ collection, overrideAccess: true });
  return result.totalDocs;
}

async function sumViews(): Promise<number> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "articles",
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
  });
  return (result.docs as Array<{ viewCount?: number | null }>).reduce(
    (total, doc) => total + (doc.viewCount ?? 0),
    0
  );
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    total,
    published,
    draft,
    scheduled,
    archived,
    categories,
    tags,
    media,
    totalViews,
    recent,
  ] = await Promise.all([
    countArticles(),
    countArticles("published"),
    countArticles("draft"),
    countArticles("scheduled"),
    countArticles("archived"),
    countCollection("categories"),
    countCollection("tags"),
    countCollection("media"),
    sumViews(),
    listAdminArticles({ limit: 5 }),
  ]);

  return {
    articles: { total, published, draft, scheduled, archived },
    categories,
    tags,
    media,
    totalViews,
    recentArticles: recent.docs as unknown as DashboardStats["recentArticles"],
  };
}

import { getPayloadClient } from "@/lib/payload/get-payload";
import type { AnalyticsData } from "./analytics.types";

type AnalyticsDoc = {
  id: string | number;
  title: string;
  slug: string;
  status: string;
  viewCount?: number | null;
  publishedAt?: string | null;
};

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const payload = await getPayloadClient();

  const all = await payload.find({
    collection: "articles",
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
  });

  const docs = all.docs as AnalyticsDoc[];

  const totalViews = docs.reduce((sum, doc) => sum + (doc.viewCount ?? 0), 0);

  const statusBreakdown = {
    published: 0,
    draft: 0,
    scheduled: 0,
    archived: 0,
  };
  docs.forEach((doc) => {
    if (doc.status in statusBreakdown) {
      statusBreakdown[doc.status as keyof typeof statusBreakdown] += 1;
    }
  });

  const topArticles = [...docs]
    .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
    .slice(0, 10)
    .map((doc) => ({
      id: String(doc.id),
      title: doc.title,
      slug: doc.slug,
      viewCount: doc.viewCount ?? 0,
      publishedAt: doc.publishedAt ?? undefined,
    }));

  return {
    totalViews,
    publishedCount: statusBreakdown.published,
    topArticles,
    statusBreakdown,
  };
}

/**
 * Atomically increment an article's public view counter. Returns silently if
 * the article does not exist so the public endpoint can stay fire-and-forget.
 */
export async function incrementArticleView(slug: string): Promise<boolean> {
  const payload = await getPayloadClient();

  const found = await payload.find({
    collection: "articles",
    where: {
      and: [{ slug: { equals: slug } }, { status: { equals: "published" } }],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });

  const article = found.docs[0] as { id: string | number; viewCount?: number | null } | undefined;
  if (!article) return false;

  await payload.update({
    collection: "articles",
    id: article.id,
    data: { viewCount: (article.viewCount ?? 0) + 1 } as never,
    overrideAccess: true,
    context: { skipHooks: true },
  });

  return true;
}

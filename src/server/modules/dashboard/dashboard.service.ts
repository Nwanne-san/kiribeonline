import type { Where } from "payload";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { listAdminArticles } from "@/server/modules/articles";
import type { AdminAuthorRef, AdminTermRef } from "@/server/shared/types";
import type {
  DashboardActivityItem,
  DashboardPerformanceItem,
  DashboardStats,
} from "./dashboard.types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function countArticles(where?: Where): Promise<number> {
  const payload = await getPayloadClient();
  const result = await payload.count({ collection: "articles", where, overrideAccess: true });
  return result.totalDocs;
}

async function countCollection(
  collection: "categories" | "tags" | "media",
  where?: Where
): Promise<number> {
  const payload = await getPayloadClient();
  const result = await payload.count({ collection, where, overrideAccess: true });
  return result.totalDocs;
}

async function countUnreadMessages(): Promise<number> {
  const payload = await getPayloadClient();
  const result = await payload.count({
    collection: "contact-messages",
    where: { read: { not_equals: true } },
    overrideAccess: true,
  });
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

function mapAuthor(author: unknown): AdminAuthorRef | undefined {
  if (!author || typeof author !== "object") return undefined;
  const doc = author as { id: string | number; name?: string | null; email?: string };
  return { id: String(doc.id), name: doc.name ?? null, email: doc.email };
}

function mapCategories(categories: unknown): AdminTermRef[] {
  if (!Array.isArray(categories)) return [];
  return categories
    .filter((c): c is { id: string | number; name: string; slug: string } => typeof c === "object" && c !== null)
    .map((c) => ({ id: String(c.id), name: c.name, slug: c.slug }));
}

async function getContentPerformance(): Promise<DashboardPerformanceItem[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "articles",
    where: { status: { equals: "published" } },
    sort: "-viewCount",
    limit: 5,
    depth: 1,
    overrideAccess: true,
  });
  return (result.docs as unknown as Array<Record<string, unknown>>).map((doc) => ({
    id: String(doc.id),
    title: String(doc.title ?? ""),
    slug: String(doc.slug ?? ""),
    viewCount: Number(doc.viewCount ?? 0),
    author: mapAuthor(doc.author),
    categories: mapCategories(doc.categories),
  }));
}

/**
 * Recent audit-log events, newest first. Used both for the dashboard preview
 * (small limit) and the full Recent Activity page (larger limit).
 */
export async function listActivity(limit = 8): Promise<DashboardActivityItem[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "audit-logs",
    sort: "-createdAt",
    limit: Math.min(Math.max(limit, 1), 100),
    depth: 0,
    overrideAccess: true,
  });
  return (result.docs as unknown as Array<Record<string, unknown>>).map((doc) => ({
    id: String(doc.id),
    action: String(doc.action ?? ""),
    actorEmail: doc.actorEmail ? String(doc.actorEmail) : undefined,
    targetType: doc.targetType ? String(doc.targetType) : undefined,
    targetId: doc.targetId ? String(doc.targetId) : undefined,
    createdAt: String(doc.createdAt ?? ""),
  }));
}

function getRecentActivity(): Promise<DashboardActivityItem[]> {
  return listActivity(8);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const weekAgo = new Date(Date.now() - WEEK_MS).toISOString();

  const [
    total,
    published,
    draft,
    inReview,
    scheduled,
    archived,
    publishedThisWeek,
    categories,
    tags,
    media,
    totalViews,
    unreadMessages,
    recent,
    recentActivity,
    contentPerformance,
  ] = await Promise.all([
    countArticles(),
    countArticles({ status: { equals: "published" } }),
    countArticles({ status: { equals: "draft" } }),
    countArticles({ status: { equals: "in_review" } }),
    countArticles({ status: { equals: "scheduled" } }),
    countArticles({ status: { equals: "archived" } }),
    countArticles({ status: { equals: "published" }, createdAt: { greater_than: weekAgo } }),
    countCollection("categories"),
    countCollection("tags"),
    countCollection("media"),
    sumViews(),
    countUnreadMessages(),
    listAdminArticles({ limit: 5 }),
    getRecentActivity(),
    getContentPerformance(),
  ]);

  return {
    articles: { total, published, draft, inReview, scheduled, archived, publishedThisWeek },
    categories,
    tags,
    media,
    totalViews,
    unreadMessages,
    recentArticles: recent.docs as unknown as DashboardStats["recentArticles"],
    recentActivity,
    contentPerformance,
  };
}

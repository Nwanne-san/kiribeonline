import type { AdminAuthorRef, AdminTermRef } from "@/server/shared/types";
import type { AdminArticleListItem } from "@/server/modules/articles/articles.types";

export type DashboardActivityItem = {
  id: string;
  action: string;
  actorEmail?: string;
  targetType?: string;
  targetId?: string;
  createdAt: string;
};

export type DashboardPerformanceItem = {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  author?: AdminAuthorRef;
  categories: AdminTermRef[];
};

export type DashboardStats = {
  articles: {
    total: number;
    published: number;
    draft: number;
    scheduled: number;
    archived: number;
    /** Articles created in the last 7 days (trend delta for tiles). */
    publishedThisWeek: number;
  };
  categories: number;
  tags: number;
  media: number;
  totalViews: number;
  unreadMessages: number;
  recentArticles: AdminArticleListItem[];
  recentActivity: DashboardActivityItem[];
  contentPerformance: DashboardPerformanceItem[];
};

import type { ArticleStatus } from "@/modules/shared/types/content";

export type AdminMediaRef = {
  id: string;
  url?: string;
  alt?: string;
};

export type AdminTermRef = {
  id: string;
  name: string;
  slug: string;
};

export type AdminListResult<T> = {
  docs: T[];
  totalDocs: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type AdminArticleListItem = {
  id: string;
  title: string;
  slug: string;
  status: ArticleStatus;
  featured: boolean;
  viewCount: number;
  publishedAt?: string;
  updatedAt: string;
  heroImage?: AdminMediaRef;
  categories: AdminTermRef[];
};

export type AdminArticleDetail = AdminArticleListItem & {
  excerpt?: string;
  bodyText: string;
  tags: AdminTermRef[];
  featuredPriority: number;
  seo?: {
    title?: string;
    description?: string;
    ogImage?: AdminMediaRef;
  };
};

export type AdminMediaItem = {
  id: string;
  url?: string;
  filename?: string;
  alt?: string;
  caption?: string;
  credit?: string;
  width?: number;
  height?: number;
  usageCount: number;
  updatedAt: string;
};

export type AdminCategory = AdminTermRef & {
  description?: string;
  displayOrder: number;
  updatedAt: string;
};

export type AdminTag = AdminTermRef & {
  updatedAt: string;
};

export type DashboardStats = {
  articles: {
    total: number;
    published: number;
    draft: number;
    scheduled: number;
    archived: number;
  };
  categories: number;
  tags: number;
  media: number;
  totalViews: number;
  recentArticles: AdminArticleListItem[];
};

export type AnalyticsData = {
  totalViews: number;
  publishedCount: number;
  topArticles: Array<{
    id: string;
    title: string;
    slug: string;
    viewCount: number;
    publishedAt?: string;
  }>;
  statusBreakdown: {
    published: number;
    draft: number;
    scheduled: number;
    archived: number;
  };
};

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

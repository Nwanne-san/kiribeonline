import type { ArticleStatus } from "@/modules/shared/types/content";
import type { AdminMediaRef, AdminTermRef, AdminAuthorRef } from "@/server/shared/types";

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
  author?: AdminAuthorRef;
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

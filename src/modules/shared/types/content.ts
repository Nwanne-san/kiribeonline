export type ArticleStatus = "draft" | "scheduled" | "published" | "archived";

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  body: unknown;
  heroImage?: MediaAsset;
  categories: Category[];
  tags: Tag[];
  seo?: SeoMetadata;
  publishedAt?: string;
  status: ArticleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface MediaAsset {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
  credit?: string;
  width?: number;
  height?: number;
}

export interface SeoMetadata {
  title?: string;
  description?: string;
  ogImage?: string;
}

export interface SiteSettings {
  siteName: string;
  logo?: MediaAsset;
  brandColors?: {
    mustard?: string;
    burgundy?: string;
  };
  socialLinks?: Array<{ platform: string; url: string }>;
  seoDefaults?: SeoMetadata;
}

export type HomepageModuleLayout = "grid-3" | "grid-2" | "list" | "hero-plus-grid";

export interface HomepageModule {
  category: Category;
  sectionTitle?: string;
  layout: HomepageModuleLayout;
  accentColor?: string;
  articles: Article[];
}

export interface Homepage {
  heroArticle?: Article;
  editorsPicks: Article[];
  categoryModules: HomepageModule[];
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actorId: string;
  targetType: string;
  targetId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
}

export type ArticleStatus =
  | "draft"
  | "in_review"
  | "scheduled"
  | "published"
  | "archived";

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
  /** Byline resolved from the related user (depth ≥ 1). */
  author?: ArticleAuthor;
}

export interface ArticleAuthor {
  id: string;
  name?: string;
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

export interface MediaVariant {
  url: string;
  width?: number;
  height?: number;
}

export type MediaSizeName = "thumbnail" | "card" | "wide" | "og";

export interface MediaAsset {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
  credit?: string;
  width?: number;
  height?: number;
  /** Pre-generated responsive variants (see Media collection `imageSizes`). */
  sizes?: Partial<Record<MediaSizeName, MediaVariant>>;
  /** Base64 LQIP data URI for next/image blur-up. */
  blurDataUrl?: string;
}

export interface SeoMetadata {
  title?: string;
  description?: string;
  ogImage?: string;
}

export interface SiteNavLink {
  label: string;
  href: string;
}

/**
 * Header/footer chrome resolved for the public site. Always populated — the
 * server falls back to category-derived defaults when an admin hasn't saved a
 * custom nav — and `headerLinks` is already capped and visibility-filtered.
 */
export interface SiteNavigation {
  headerLinks: SiteNavLink[];
  footerColumns: Array<{ title: string; links: SiteNavLink[] }>;
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
  navigation?: SiteNavigation;
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

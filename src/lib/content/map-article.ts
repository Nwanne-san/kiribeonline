import type { Article, Category, MediaAsset, Tag } from "@/modules/shared/types/content";
import { resolveMediaUrl } from "@/lib/storage/media-url";

type PayloadMedia = {
  id: string;
  url?: string | null;
  filename?: string | null;
  alt?: string | null;
  caption?: string | null;
  credit?: string | null;
  width?: number | null;
  height?: number | null;
};

type PayloadCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  displayOrder?: number | null;
};

type PayloadTag = {
  id: string;
  name: string;
  slug: string;
};

type PayloadArticleDoc = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  body: unknown;
  heroImage?: PayloadMedia | string | null;
  categories?: (PayloadCategory | string)[] | null;
  tags?: (PayloadTag | string)[] | null;
  status: Article["status"];
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  seo?: {
    title?: string | null;
    description?: string | null;
    ogImage?: PayloadMedia | string | null;
  } | null;
};

export function mapPayloadMedia(source?: PayloadMedia | string | null): MediaAsset | undefined {
  if (!source || typeof source === "string") return undefined;
  const url = resolveMediaUrl(source);
  if (!url) return undefined;
  return {
    id: String(source.id),
    url,
    alt: source.alt ?? undefined,
    caption: source.caption ?? undefined,
    credit: source.credit ?? undefined,
    width: source.width ?? undefined,
    height: source.height ?? undefined,
  };
}

function mapCategory(item: PayloadCategory | string): Category | null {
  if (typeof item === "string") return null;
  return {
    id: String(item.id),
    name: item.name,
    slug: item.slug,
    description: item.description ?? undefined,
    displayOrder: item.displayOrder ?? 0,
  };
}

function mapTag(item: PayloadTag | string): Tag | null {
  if (typeof item === "string") return null;
  return {
    id: String(item.id),
    name: item.name,
    slug: item.slug,
  };
}

export function mapPayloadArticle(doc: PayloadArticleDoc): Article {
  return {
    id: String(doc.id),
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt ?? undefined,
    body: doc.body,
    heroImage: mapPayloadMedia(
      typeof doc.heroImage === "string" ? undefined : doc.heroImage ?? undefined
    ),
    categories: (doc.categories ?? [])
      .map(mapCategory)
      .filter((item): item is Category => item !== null),
    tags: (doc.tags ?? []).map(mapTag).filter((item): item is Tag => item !== null),
    status: doc.status,
    publishedAt: doc.publishedAt ?? undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    seo: doc.seo
      ? {
          title: doc.seo.title ?? undefined,
          description: doc.seo.description ?? undefined,
          ogImage: mapPayloadMedia(
            typeof doc.seo.ogImage === "string" ? undefined : doc.seo.ogImage ?? undefined
          )?.url,
        }
      : undefined,
  };
}

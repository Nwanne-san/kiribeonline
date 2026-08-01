import type {
  Article,
  Category,
  MediaAsset,
  MediaSizeName,
  MediaVariant,
  Tag,
} from "@/modules/shared/types/content";
import { resolveMediaUrl } from "@/lib/storage/media-url";
import { estimateReadingTime } from "@/utils/helper";
import type { ArticleCardDoc } from "@/lib/content/types";

type PayloadMediaVariant = {
  url?: string | null;
  filename?: string | null;
  width?: number | null;
  height?: number | null;
};

type PayloadMedia = {
  id: string;
  url?: string | null;
  filename?: string | null;
  alt?: string | null;
  caption?: string | null;
  credit?: string | null;
  width?: number | null;
  height?: number | null;
  blurDataUrl?: string | null;
  sizes?: Partial<Record<MediaSizeName, PayloadMediaVariant | null>> | null;
};

const SIZE_NAMES: MediaSizeName[] = ["thumbnail", "card", "wide", "og"];

function mapVariant(source?: PayloadMediaVariant | null): MediaVariant | undefined {
  if (!source) return undefined;
  const url = resolveMediaUrl(source);
  if (!url) return undefined;
  return {
    url,
    width: source.width ?? undefined,
    height: source.height ?? undefined,
  };
}

function mapSizes(
  sizes?: PayloadMedia["sizes"]
): MediaAsset["sizes"] | undefined {
  if (!sizes) return undefined;
  const mapped: Partial<Record<MediaSizeName, MediaVariant>> = {};
  for (const name of SIZE_NAMES) {
    const variant = mapVariant(sizes[name]);
    if (variant) mapped[name] = variant;
  }
  return Object.keys(mapped).length > 0 ? mapped : undefined;
}

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
  author?: { id: string | number; name?: string | null } | string | null;
  hideByline?: boolean | null;
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
    sizes: mapSizes(source.sizes),
    blurDataUrl: source.blurDataUrl ?? undefined,
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

/**
 * Reduce a raw Payload article doc to the lean shape card grids need.
 *
 * Card lists (archives, homepage modules, `/api/articles`, `/api/search`) never
 * render the article body — shipping the full Lexical tree per card bloats the
 * payload. We derive the reading-time estimate server-side and drop `body`.
 */
export function toArticleCardDoc(
  doc: ArticleCardDoc & { body?: unknown }
): ArticleCardDoc {
  const { body, readingTime, ...rest } = doc;
  return {
    ...rest,
    // Redaction, not just display: an opted-out name must not ship at all.
    // These docs are serialised into `/api/articles`, `/api/search`, and the
    // RSC payload, so leaving `author` populated would publish the exact name
    // the writer withheld — anyone could read it out of the JSON.
    author: rest.hideByline ? undefined : rest.author,
    readingTime: readingTime ?? estimateReadingTime(body),
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
    // Dropped entirely when the byline is hidden — this object is serialised
    // into the RSC payload, so keeping the name here would publish it in the
    // page source. `resolvePublicByline` renders "Kiribé Editor" instead.
    author:
      !doc.hideByline && doc.author && typeof doc.author === "object"
        ? { id: String(doc.author.id), name: doc.author.name ?? undefined }
        : undefined,
    hideByline: doc.hideByline ?? false,
    status: doc.status,
    publishedAt: doc.publishedAt ?? undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    seo: doc.seo
      ? {
          title: doc.seo.title ?? undefined,
          description: doc.seo.description ?? undefined,
          // Prefer the purpose-built 1200×630 `og` crop for social previews,
          // falling back to the full-size original.
          ogImage: (() => {
            const asset = mapPayloadMedia(
              typeof doc.seo.ogImage === "string" ? undefined : doc.seo.ogImage ?? undefined
            );
            return asset?.sizes?.og?.url ?? asset?.url;
          })(),
        }
      : undefined,
  };
}

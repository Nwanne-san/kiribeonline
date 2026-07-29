import { unstable_cache } from "next/cache";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { resolveMediaUrl } from "@/lib/storage/media-url";

export type PublicPage = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  body?: unknown;
  publishedAt?: string | null;
  updatedAt?: string | null;
  seo?: {
    title?: string | null;
    description?: string | null;
    ogImage?: string | null;
  };
};

type RawMedia = { url?: string | null; filename?: string | null };

type RawPage = {
  id: string | number;
  title?: string | null;
  slug?: string | null;
  excerpt?: string | null;
  body?: unknown;
  publishedAt?: string | null;
  updatedAt?: string | null;
  seo?: {
    title?: string | null;
    description?: string | null;
    ogImage?: RawMedia | string | number | null;
  } | null;
};

function mapPage(doc: RawPage): PublicPage {
  const ogImage =
    doc.seo?.ogImage && typeof doc.seo.ogImage === "object"
      ? resolveMediaUrl(doc.seo.ogImage as RawMedia)
      : null;
  return {
    id: String(doc.id),
    title: doc.title ?? "",
    slug: doc.slug ?? "",
    excerpt: doc.excerpt ?? null,
    body: doc.body ?? null,
    publishedAt: doc.publishedAt ?? null,
    updatedAt: doc.updatedAt ?? null,
    seo: {
      title: doc.seo?.title ?? null,
      description: doc.seo?.description ?? null,
      ogImage: ogImage ?? null,
    },
  };
}

async function fetchPageBySlugUncached(
  slug: string
): Promise<PublicPage | null> {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "pages",
      where: {
        and: [{ slug: { equals: slug } }, { status: { equals: "published" } }],
      },
      limit: 1,
      depth: 1,
    });
    const doc = result.docs[0] as RawPage | undefined;
    return doc ? mapPage(doc) : null;
  } catch {
    return null;
  }
}

/**
 * A published CMS page by slug, or null. Dev bypasses the data cache so editors
 * see saves immediately; prod/staging go through the `pages` tag, which the
 * collection's afterChange hook drops on every write.
 */
export async function getPublishedPageBySlug(
  slug: string
): Promise<PublicPage | null> {
  if (process.env.NODE_ENV === "development") {
    return fetchPageBySlugUncached(slug);
  }
  return unstable_cache(
    () => fetchPageBySlugUncached(slug),
    ["page-public", slug],
    { tags: ["pages"], revalidate: 60 }
  )();
}

async function fetchPublishedPageSlugsUncached(): Promise<
  Array<{ slug: string; updatedAt?: string | null }>
> {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "pages",
      where: { status: { equals: "published" } },
      limit: 200,
      depth: 0,
      sort: "slug",
    });
    return (result.docs as RawPage[])
      .filter((doc) => doc.slug)
      .map((doc) => ({
        slug: doc.slug as string,
        updatedAt: doc.updatedAt ?? doc.publishedAt ?? null,
      }));
  } catch {
    return [];
  }
}

/** Published page slugs for the sitemap and `/llms.txt`. */
export const getPublishedPageSlugs = unstable_cache(
  fetchPublishedPageSlugsUncached,
  ["page-slugs-public"],
  { tags: ["pages"], revalidate: 60 }
);

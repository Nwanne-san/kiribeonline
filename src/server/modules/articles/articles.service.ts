import type { Where } from "payload";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { textToLexical } from "@/server/shared/text-to-lexical";
import type { ArticleInput } from "@/server/modules";
import { slugify } from "@/utils/helper";

/**
 * Coerce a relationship id to the shape Payload expects. Our Postgres adapter
 * uses integer ids, but the admin client sends them as strings (select values).
 * All-digit strings become numbers; anything else (e.g. Mongo ObjectIds) is
 * passed through unchanged. Empty/nullish → undefined (clears the relation).
 */
function toRelId(
  value: string | number | null | undefined
): number | string | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number") return value;
  return /^\d+$/.test(value) ? Number(value) : value;
}

function toRelIds(
  values: Array<string | number> | undefined
): Array<number | string> | undefined {
  if (!values) return undefined;
  return values
    .map((v) => toRelId(v))
    .filter((v): v is number | string => v !== undefined);
}

function mapArticleInput(input: ArticleInput) {
  const body =
    input.body ??
    (input.bodyText ? textToLexical(input.bodyText) : textToLexical(""));

  return {
    title: input.title,
    slug: input.slug ?? slugify(input.title),
    excerpt: input.excerpt,
    body,
    categories: toRelIds(input.categoryIds) ?? [],
    tags: toRelIds(input.tagIds) ?? [],
    author: toRelId(input.authorId),
    heroImage: toRelId(input.heroImageId),
    status: input.status,
    publishedAt: input.publishedAt ?? undefined,
    featured: input.featured ?? false,
    featuredPriority: input.featuredPriority ?? 0,
    seo: input.seo
      ? {
          title: input.seo.title,
          description: input.seo.description,
          ogImage: toRelId(input.seo.ogImageId),
        }
      : undefined,
  };
}

export type ListAdminArticlesParams = {
  status?: string;
  q?: string;
  /** Filter by category relationship id (membership match). */
  categoryId?: string;
  /** Filter by author (user) relationship id. */
  authorId?: string;
  /** Publish-date ordering. Defaults to newest first. */
  sort?: "newest" | "oldest";
  page?: number;
  limit?: number;
};

export async function listAdminArticles(params?: ListAdminArticlesParams) {
  const payload = await getPayloadClient();

  const conditions: Where[] = [];
  if (params?.status) conditions.push({ status: { equals: params.status } });
  if (params?.categoryId) conditions.push({ categories: { equals: params.categoryId } });
  if (params?.authorId) conditions.push({ author: { equals: params.authorId } });
  if (params?.q) {
    const q = params.q.trim();
    conditions.push({ or: [{ title: { like: q } }, { slug: { like: q } }] });
  }
  const where: Where | undefined = conditions.length ? { and: conditions } : undefined;

  // When the caller picks a date order, sort by publish date (matches the list's
  // Date column). Otherwise keep the legacy recency order so other callers
  // (e.g. the dashboard) are unaffected.
  const sort =
    params?.sort === "oldest"
      ? "publishedAt"
      : params?.sort === "newest"
        ? "-publishedAt"
        : "-updatedAt";

  return payload.find({
    collection: "articles",
    where,
    page: params?.page ?? 1,
    limit: params?.limit ?? 50,
    sort,
    depth: 1,
    overrideAccess: true,
  });
}

export type BulkArticleAction = "publish" | "unpublish" | "archive" | "delete";

/**
 * Apply a bulk action across many articles. Publishing stamps `publishedAt`
 * (mirrors the single-article beforeChange hook). Returns per-id success so the
 * caller can report partial failures.
 */
export async function bulkUpdateArticles(ids: string[], action: BulkArticleAction) {
  const payload = await getPayloadClient();

  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        if (action === "delete") {
          await payload.delete({ collection: "articles", id, overrideAccess: true });
        } else {
          const data: Record<string, unknown> =
            action === "publish"
              ? { status: "published" }
              : action === "unpublish"
                ? { status: "draft" }
                : { status: "archived" };
          await payload.update({ collection: "articles", id, data, overrideAccess: true });
        }
        return { id, ok: true };
      } catch (error) {
        return { id, ok: false, error: (error as Error).message };
      }
    })
  );

  return {
    action,
    updated: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok),
  };
}

export async function getAdminArticle(id: string) {
  const payload = await getPayloadClient();
  return payload.findByID({ collection: "articles", id, depth: 2, overrideAccess: true });
}

export async function createAdminArticle(input: ArticleInput) {
  const payload = await getPayloadClient();
  return payload.create({
    collection: "articles",
    data: mapArticleInput(input) as never,
    overrideAccess: true,
  });
}

export async function updateAdminArticle(id: string, input: Partial<ArticleInput>) {
  const payload = await getPayloadClient();
  const data: Record<string, unknown> = {};
  if (input.title) data.title = input.title;
  if (input.slug) data.slug = input.slug;
  if (input.excerpt !== undefined) data.excerpt = input.excerpt;
  if (input.body) data.body = input.body;
  else if (input.bodyText) data.body = textToLexical(input.bodyText);
  if (input.categoryIds) data.categories = toRelIds(input.categoryIds) ?? [];
  if (input.tagIds) data.tags = toRelIds(input.tagIds) ?? [];
  if (input.authorId !== undefined) data.author = toRelId(input.authorId) ?? null;
  if (input.heroImageId !== undefined) data.heroImage = toRelId(input.heroImageId) ?? null;
  if (input.status) data.status = input.status;
  if (input.publishedAt !== undefined) data.publishedAt = input.publishedAt;
  if (input.featured !== undefined) data.featured = input.featured;
  if (input.featuredPriority !== undefined) data.featuredPriority = input.featuredPriority;
  if (input.seo) {
    data.seo = {
      title: input.seo.title,
      description: input.seo.description,
      ogImage: toRelId(input.seo.ogImageId) ?? undefined,
    };
  }
  return payload.update({ collection: "articles", id, data, overrideAccess: true });
}

export async function deleteAdminArticle(id: string) {
  const payload = await getPayloadClient();
  return payload.delete({ collection: "articles", id, overrideAccess: true });
}

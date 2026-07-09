import type { Where } from "payload";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { textToLexical } from "@/server/shared/text-to-lexical";
import type { ArticleInput } from "@/server/modules";
import { slugify } from "@/utils/helper";

function mapArticleInput(input: ArticleInput) {
  const body =
    input.body ??
    (input.bodyText ? textToLexical(input.bodyText) : textToLexical(""));

  return {
    title: input.title,
    slug: input.slug ?? slugify(input.title),
    excerpt: input.excerpt,
    body,
    categories: input.categoryIds,
    tags: input.tagIds,
    author: input.authorId ?? undefined,
    heroImage: input.heroImageId ?? undefined,
    status: input.status,
    publishedAt: input.publishedAt ?? undefined,
    featured: input.featured ?? false,
    featuredPriority: input.featuredPriority ?? 0,
    seo: input.seo
      ? {
          title: input.seo.title,
          description: input.seo.description,
          ogImage: input.seo.ogImageId ?? undefined,
        }
      : undefined,
  };
}

export type ListAdminArticlesParams = {
  status?: string;
  q?: string;
  page?: number;
  limit?: number;
};

export async function listAdminArticles(params?: ListAdminArticlesParams) {
  const payload = await getPayloadClient();

  const conditions: Where[] = [];
  if (params?.status) conditions.push({ status: { equals: params.status } });
  if (params?.q) {
    const q = params.q.trim();
    conditions.push({ or: [{ title: { like: q } }, { slug: { like: q } }] });
  }
  const where: Where | undefined = conditions.length ? { and: conditions } : undefined;

  return payload.find({
    collection: "articles",
    where,
    page: params?.page ?? 1,
    limit: params?.limit ?? 50,
    sort: "-updatedAt",
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
  if (input.categoryIds) data.categories = input.categoryIds;
  if (input.tagIds) data.tags = input.tagIds;
  if (input.authorId !== undefined) data.author = input.authorId;
  if (input.heroImageId !== undefined) data.heroImage = input.heroImageId;
  if (input.status) data.status = input.status;
  if (input.publishedAt !== undefined) data.publishedAt = input.publishedAt;
  if (input.featured !== undefined) data.featured = input.featured;
  if (input.featuredPriority !== undefined) data.featuredPriority = input.featuredPriority;
  if (input.seo) {
    data.seo = {
      title: input.seo.title,
      description: input.seo.description,
      ogImage: input.seo.ogImageId ?? undefined,
    };
  }
  return payload.update({ collection: "articles", id, data, overrideAccess: true });
}

export async function deleteAdminArticle(id: string) {
  const payload = await getPayloadClient();
  return payload.delete({ collection: "articles", id, overrideAccess: true });
}

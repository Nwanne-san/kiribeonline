import { getPayloadClient } from "@/lib/payload/get-payload";
import { textToLexical } from "@/lib/admin/text-to-lexical";
import type { ArticleInput } from "@/lib/validation/admin";
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

export async function listAdminArticles(params?: { status?: string; limit?: number }) {
  const payload = await getPayloadClient();
  const where = params?.status ? { status: { equals: params.status } } : undefined;
  return payload.find({
    collection: "articles",
    where,
    limit: params?.limit ?? 50,
    sort: "-updatedAt",
    depth: 1,
    overrideAccess: true,
  });
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

export async function getDashboardStats() {
  const payload = await getPayloadClient();
  const [published, draft, scheduled, media] = await Promise.all([
    payload.count({ collection: "articles", where: { status: { equals: "published" } }, overrideAccess: true }),
    payload.count({ collection: "articles", where: { status: { equals: "draft" } }, overrideAccess: true }),
    payload.count({ collection: "articles", where: { status: { equals: "scheduled" } }, overrideAccess: true }),
    payload.count({ collection: "media", overrideAccess: true }),
  ]);
  return { published, draft, scheduled, media };
}

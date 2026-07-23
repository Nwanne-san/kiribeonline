import type { Where } from "payload";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { textToLexical } from "@/server/shared/text-to-lexical";
import { toRelId, toRelIds } from "@/server/shared/rel-id";
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

/**
 * Cheap ownership probe used by the ownership guard on PATCH/DELETE/bulk. Reads
 * only the `author` relation with `depth: 0` so the returned value is the
 * author's id (never a full document), and skips access checks — the caller is
 * about to enforce them itself.
 */
export async function getAdminArticleAuthorId(id: string): Promise<string | null> {
  const payload = await getPayloadClient();
  const doc = await payload.findByID({
    collection: "articles",
    id,
    depth: 0,
    overrideAccess: true,
  });
  return normalizeAuthorId((doc as { author?: unknown }).author);
}

/**
 * True when every id in `ids` is authored by `userId`. Single query — the
 * ownership guard on bulk mutations uses this to avoid an N+1 findByID.
 * Returns false if any id belongs to someone else, is unowned, or doesn't
 * exist (we do not want a caller to succeed on ids they can't observe).
 */
export async function allArticlesOwnedBy(ids: string[], userId: string | number): Promise<boolean> {
  if (ids.length === 0) return true;
  const payload = await getPayloadClient();
  const foreign = await payload.find({
    collection: "articles",
    where: {
      and: [
        { id: { in: ids } },
        { author: { not_equals: userId } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    pagination: false,
  });
  if (foreign.docs.length > 0) return false;
  const mine = await payload.find({
    collection: "articles",
    where: { and: [{ id: { in: ids } }, { author: { equals: userId } }] },
    limit: ids.length,
    depth: 0,
    overrideAccess: true,
    pagination: false,
  });
  return mine.docs.length === ids.length;
}

function normalizeAuthorId(author: unknown): string | null {
  if (author === null || author === undefined) return null;
  if (typeof author === "string" || typeof author === "number") return String(author);
  if (typeof author === "object" && "id" in (author as Record<string, unknown>)) {
    const id = (author as { id: unknown }).id;
    if (typeof id === "string" || typeof id === "number") return String(id);
  }
  return null;
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

/**
 * Cheap uniqueness probe for the editor's inline slug validator. Returns
 * `{ available }` — the caller keeps its own error copy so we don't leak
 * back a stored slug or an owner. `excludeId` lets an edit-in-place check
 * ignore the article's own row (a slug is available if no *other* article
 * has it).
 */
export async function isArticleSlugAvailable(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const payload = await getPayloadClient();
  const trimmed = slug.trim();
  if (!trimmed) return false;

  // Payload's Postgres adapter doesn't support `and` + `not_equals` cleanly on
  // an id column across all driver versions we run; fetch matches and filter
  // in memory (slug is unique-indexed, so this is at most one row).
  const result = await payload.find({
    collection: "articles",
    where: { slug: { equals: trimmed } },
    limit: 2,
    depth: 0,
    overrideAccess: true,
    pagination: false,
  });

  const others = result.docs.filter(
    (doc) => !excludeId || String((doc as { id: string | number }).id) !== excludeId
  );
  return others.length === 0;
}

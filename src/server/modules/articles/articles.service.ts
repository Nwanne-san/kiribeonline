import type { Where } from "payload";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { textToLexical } from "@/server/shared/text-to-lexical";
import { toRelId, toRelIds } from "@/server/shared/rel-id";
import type { ArticleInput } from "@/server/modules";
import { slugify } from "@/utils/helper";
import {
  sendArticleApprovedEmail,
  sendArticleChangesRequestedEmail,
  sendArticleSubmittedEmailToAdmins,
} from "./status-emails";

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
    hideByline: input.hideByline ?? false,
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
  /** Inclusive lower bound on `publishedAt` (ISO 8601). */
  publishedFrom?: string;
  /** Inclusive upper bound on `publishedAt` (ISO 8601). */
  publishedTo?: string;
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
  if (params?.publishedFrom)
    conditions.push({ publishedAt: { greater_than_equal: params.publishedFrom } });
  if (params?.publishedTo)
    conditions.push({ publishedAt: { less_than_equal: params.publishedTo } });
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

export type UpdateArticleContext = {
  /** The admin performing the update. Used only for status-change email attribution. */
  actor?: { id: string | number; name?: string | null };
  /** Optional editor note carried into a "changes requested" email. */
  reviewNote?: string;
};

export async function updateAdminArticle(
  id: string,
  input: Partial<ArticleInput>,
  context?: UpdateArticleContext
) {
  const payload = await getPayloadClient();

  // Snapshot the pre-update state so we can detect status transitions that
  // deserve a notification. depth:1 pulls the author relation as a doc so we
  // have their email + name without a second lookup.
  const shouldTriggerEmail = input.status !== undefined;
  const before = shouldTriggerEmail
    ? ((await payload.findByID({
        collection: "articles",
        id,
        depth: 1,
        overrideAccess: true,
      })) as {
        status?: string | null;
        title?: string | null;
        slug?: string | null;
        author?: unknown;
      })
    : null;

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
  if (input.hideByline !== undefined) data.hideByline = input.hideByline;
  if (input.seo) {
    data.seo = {
      title: input.seo.title,
      description: input.seo.description,
      ogImage: toRelId(input.seo.ogImageId) ?? undefined,
    };
  }

  const doc = await payload.update({
    collection: "articles",
    id,
    data,
    overrideAccess: true,
  });

  if (shouldTriggerEmail && before) {
    dispatchStatusEmail({
      id,
      before,
      after: doc as {
        status?: string | null;
        title?: string | null;
        slug?: string | null;
      },
      context,
    });
  }

  return doc;
}

type ArticleAuthorDoc = {
  id?: string | number;
  email?: string | null;
  name?: string | null;
};

function extractAuthor(raw: unknown): ArticleAuthorDoc | null {
  if (!raw || typeof raw !== "object") return null;
  const doc = raw as ArticleAuthorDoc;
  return doc.email ? doc : null;
}

/**
 * Fire the right transactional email when a writer's article moves between
 * review states — but never on self-edits (a writer publishing their own draft
 * doesn't need congratulating themselves) and never if we can't reach them.
 *
 *  - submitted:           any                → in_review (fan-out to admins)
 *  - approved:            in_review / draft  → published or scheduled
 *  - changes requested:   in_review          → draft (editor pushed it back)
 *
 * All fire-and-forget; delivery failures are logged inside the send helpers.
 */
function dispatchStatusEmail({
  id,
  before,
  after,
  context,
}: {
  id: string;
  before: { status?: string | null; author?: unknown };
  after: { status?: string | null; title?: string | null; slug?: string | null };
  context?: UpdateArticleContext;
}) {
  const oldStatus = before.status ?? undefined;
  const newStatus = after.status ?? undefined;
  if (!newStatus || oldStatus === newStatus) return;

  const author = extractAuthor(before.author);
  const articleTitle = after.title ?? "Your article";

  // A transition INTO in_review is a review-queue notification to admins.
  // This fires whether or not the writer has an email on file (unlike the
  // other status emails, the audience here is not the writer) and whether
  // the actor is the writer themselves (a writer filing their own piece is
  // the whole point — admins still need to see it).
  if (newStatus === "in_review") {
    const writerForAdmins = author
      ? { name: author.name, email: author.email, id: author.id }
      : context?.actor
        ? { name: context.actor.name ?? null, email: null, id: context.actor.id }
        : { name: null, email: null };
    void sendArticleSubmittedEmailToAdmins({
      articleTitle,
      articleId: id,
      writer: writerForAdmins,
      submittedAtISO: new Date().toISOString(),
    }).catch((err) => {
      console.error("[articles] admin review notification failed", err);
    });
    return;
  }

  if (!author?.email) return;

  // Skip self-edits — a writer approving/pushing back their own draft is not
  // an audience for either template.
  if (context?.actor && String(context.actor.id) === String(author.id)) return;

  const writer = { email: author.email, name: author.name };
  const editor = context?.actor
    ? { name: context.actor.name ?? null }
    : undefined;

  if (newStatus === "published" || newStatus === "scheduled") {
    const publishedAt =
      newStatus === "scheduled"
        ? ((after as unknown as { publishedAt?: string | null }).publishedAt ?? undefined)
        : undefined;
    void sendArticleApprovedEmail({
      writer,
      editor,
      articleTitle,
      articleSlug: after.slug ?? "",
      articleId: id,
      scheduledFor: publishedAt ?? undefined,
    }).catch((err) => {
      console.error("[articles] approved notification failed", err);
    });
    return;
  }

  if (oldStatus === "in_review" && newStatus === "draft") {
    void sendArticleChangesRequestedEmail({
      writer,
      editor,
      articleTitle,
      articleId: id,
      note: context?.reviewNote,
    }).catch((err) => {
      console.error("[articles] changes requested notification failed", err);
    });
  }
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

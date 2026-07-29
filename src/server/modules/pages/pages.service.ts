import { getPayloadClient } from "@/lib/payload/get-payload";
import { toRelId } from "@/server/shared/rel-id";
import { slugify } from "@/utils/helper";
import type { PageCreateInput, PageUpdateInput } from "./pages.dto";
import type {
  AdminPageDetail,
  AdminPageList,
  AdminPageSummary,
  PageStatus,
} from "./pages.types";

type RawPage = {
  id: string | number;
  title?: string | null;
  slug?: string | null;
  status?: string | null;
  showInFooter?: boolean | null;
  excerpt?: string | null;
  body?: unknown;
  publishedAt?: string | null;
  updatedAt?: string | null;
  seo?: {
    title?: string | null;
    description?: string | null;
    ogImage?: { id?: string | number } | string | number | null;
  } | null;
};

function toStatus(value: unknown): PageStatus {
  return value === "published" ? "published" : "draft";
}

function toSummary(doc: RawPage): AdminPageSummary {
  return {
    id: String(doc.id),
    title: doc.title ?? "Untitled",
    slug: doc.slug ?? "",
    status: toStatus(doc.status),
    showInFooter: Boolean(doc.showInFooter),
    publishedAt: doc.publishedAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}

function relIdToString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") {
    const id = (value as { id?: string | number }).id;
    return id === undefined ? null : String(id);
  }
  return String(value);
}

function toDetail(doc: RawPage): AdminPageDetail {
  return {
    ...toSummary(doc),
    excerpt: doc.excerpt ?? null,
    body: doc.body ?? null,
    seo: {
      title: doc.seo?.title ?? null,
      description: doc.seo?.description ?? null,
      ogImageId: relIdToString(doc.seo?.ogImage),
    },
  };
}

export async function listPagesAdmin(): Promise<AdminPageList> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "pages",
    sort: "-updatedAt",
    limit: 200,
    depth: 0,
    overrideAccess: true,
  });
  return {
    docs: (result.docs as RawPage[]).map(toSummary),
    totalDocs: result.totalDocs,
  };
}

export async function getPageAdmin(id: string): Promise<AdminPageDetail> {
  const payload = await getPayloadClient();
  const doc = (await payload.findByID({
    collection: "pages",
    id,
    depth: 1,
    overrideAccess: true,
  })) as RawPage;
  return toDetail(doc);
}

/**
 * Maps a validated DTO onto Payload field names. Only keys the client actually
 * sent are written, so a PATCH from the editor's status dropdown can't blank
 * the body it never loaded.
 */
function toPayloadData(
  input: PageCreateInput | PageUpdateInput
): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.excerpt !== undefined) data.excerpt = input.excerpt;
  if (input.body !== undefined) data.body = input.body;
  if (input.showInFooter !== undefined) data.showInFooter = input.showInFooter;
  if (input.status !== undefined) {
    data.status = input.status;
    // Stamp the first publish so the public page has a date to render and the
    // sitemap has something better than `updatedAt` for `lastModified`.
    if (input.status === "published" && input.publishedAt === undefined) {
      data.publishedAt = new Date().toISOString();
    }
  }
  if (input.publishedAt !== undefined) data.publishedAt = input.publishedAt;
  if (input.seo !== undefined) {
    const seo: Record<string, unknown> = {
      title: input.seo.title,
      description: input.seo.description,
    };
    // Mirrors the settings route: an explicit `null` clears the upload
    // relation, an omitted key leaves the current image alone.
    if (input.seo.ogImageId !== undefined) {
      seo.ogImage = input.seo.ogImageId ? toRelId(input.seo.ogImageId) : null;
    }
    data.seo = seo;
  }
  return data;
}

export async function createPageAdmin(input: PageCreateInput) {
  const payload = await getPayloadClient();
  const data = toPayloadData(input);
  data.slug = input.slug ?? slugify(input.title);
  const doc = (await payload.create({
    collection: "pages",
    data: data as never,
    overrideAccess: true,
  })) as RawPage;
  return toDetail(doc);
}

export async function updatePageAdmin(id: string, input: PageUpdateInput) {
  const payload = await getPayloadClient();
  const doc = (await payload.update({
    collection: "pages",
    id,
    data: toPayloadData(input) as never,
    overrideAccess: true,
  })) as RawPage;
  return toDetail(doc);
}

export async function deletePageAdmin(id: string) {
  const payload = await getPayloadClient();
  await payload.delete({ collection: "pages", id, overrideAccess: true });
  return { id };
}

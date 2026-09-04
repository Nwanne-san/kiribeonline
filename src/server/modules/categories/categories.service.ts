import { getPayloadClient } from "@/lib/payload/get-payload";
import { DomainError } from "@/server/errors";
import type { categoryInputSchema, categoryUpdateInputSchema } from "./categories.dto";
import type { AdminCategory } from "./categories.types";
import type { z } from "zod";

type CategoryInput = z.infer<typeof categoryInputSchema>;
type CategoryUpdateInput = z.infer<typeof categoryUpdateInputSchema>;

type CategoryDoc = {
  id: string | number;
  name: string;
  slug: string;
  description?: string | null;
  brandColor?: string | null;
  displayOrder?: number | null;
  showInNav?: boolean | null;
  isSystem?: boolean | null;
  updatedAt: string;
};

/**
 * List categories ordered by displayOrder, each enriched with the number of
 * articles referencing it. Counts are batched in parallel via payload.count.
 */
export async function listCategories(): Promise<{ docs: AdminCategory[] }> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "categories",
    sort: "displayOrder",
    limit: 100,
    overrideAccess: true,
  });

  const docs = await Promise.all(
    (result.docs as CategoryDoc[]).map(async (doc) => {
      const count = await payload.count({
        collection: "articles",
        where: { categories: { contains: doc.id } },
        overrideAccess: true,
      });
      return {
        id: String(doc.id),
        name: doc.name,
        slug: doc.slug,
        description: doc.description ?? undefined,
        brandColor: doc.brandColor ?? undefined,
        displayOrder: doc.displayOrder ?? 0,
        showInNav: doc.showInNav ?? undefined,
        isSystem: doc.isSystem ?? undefined,
        articleCount: count.totalDocs,
        updatedAt: doc.updatedAt,
      } satisfies AdminCategory;
    })
  );

  return { docs };
}

export async function createCategory(input: CategoryInput) {
  const payload = await getPayloadClient();
  return payload.create({
    collection: "categories",
    data: input as never,
    overrideAccess: true,
  });
}

export async function updateCategory(id: string, input: CategoryUpdateInput) {
  const payload = await getPayloadClient();
  return payload.update({
    collection: "categories",
    id,
    data: input as never,
    overrideAccess: true,
  });
}

type SettingsNav = {
  headerLinks?: Array<{ href?: string | null } | null> | null;
  footerColumns?: Array<{ links?: Array<{ href?: string | null } | null> | null } | null> | null;
};

/**
 * Delete a category. Two protections:
 *
 * 1. **Hard block** when the category is referenced in the site header or
 *    footer nav AND still has articles. The nav config stores freeform hrefs
 *    (see `SiteSettings.navigation.headerLinks[].href`), so the check
 *    string-matches `/categories/<slug>`. Editors must reassign the articles
 *    or remove the nav entry before we'll delete.
 * 2. **Cascade** otherwise: every article carrying the category is archived
 *    (status → `archived`) AND has the category id stripped from its
 *    `categories[]` array. Archiving preserves the article record for
 *    recovery while removing it from public surfaces.
 */
export async function deleteCategory(id: string) {
  const payload = await getPayloadClient();

  const cat = (await payload.findByID({
    collection: "categories",
    id,
    overrideAccess: true,
  })) as { name?: string; slug?: string } | null;
  if (!cat) throw new DomainError("Category not found.", 404);

  const impacted = await payload.find({
    collection: "articles",
    where: { categories: { contains: id } },
    limit: 10_000,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });
  const articleCount = impacted.docs.length;

  const settings = (await payload.findGlobal({
    slug: "site-settings",
    overrideAccess: true,
  })) as { navigation?: SettingsNav } | null;
  const nav = settings?.navigation ?? {};
  const categoryPath = `/categories/${cat.slug ?? ""}`;

  const inHeader = (nav.headerLinks ?? []).some(
    (l) => l?.href === categoryPath
  );
  const inFooter = (nav.footerColumns ?? []).some((col) =>
    (col?.links ?? []).some((l) => l?.href === categoryPath)
  );

  if ((inHeader || inFooter) && articleCount > 0) {
    const surfaces = [inHeader && "header nav", inFooter && "footer nav"]
      .filter(Boolean)
      .join(" and ");
    throw new DomainError(
      `Cannot delete "${cat.name ?? "category"}" — it appears in the ${surfaces} and has ${articleCount} article${articleCount === 1 ? "" : "s"}. Remove the nav entry or reassign the articles first.`,
      409
    );
  }

  for (const article of impacted.docs) {
    const nextCategories = (
      (article as { categories?: Array<string | number | { id: string | number }> })
        .categories ?? []
    )
      .map((c) => (typeof c === "object" && c !== null ? c.id : c))
      .filter((cid) => String(cid) !== String(id));
    await payload.update({
      collection: "articles",
      id: article.id,
      data: {
        categories: nextCategories as never,
        status: "archived",
      },
      overrideAccess: true,
    });
  }

  await payload.delete({ collection: "categories", id, overrideAccess: true });
  return { deleted: true, articlesArchived: articleCount };
}

/**
 * Persist a new category order. `ids` is the full ordered list; each category's
 * displayOrder is set to its index. System categories accept displayOrder
 * changes (only name/slug/isSystem are locked).
 */
export async function reorderCategories(ids: string[]) {
  const payload = await getPayloadClient();
  await Promise.all(
    ids.map((id, index) =>
      payload.update({
        collection: "categories",
        id,
        data: { displayOrder: index },
        overrideAccess: true,
      })
    )
  );
  return { reordered: ids.length };
}

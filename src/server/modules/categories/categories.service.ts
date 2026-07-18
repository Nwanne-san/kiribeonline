import { getPayloadClient } from "@/lib/payload/get-payload";
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

export async function deleteCategory(id: string) {
  const payload = await getPayloadClient();
  await payload.delete({ collection: "categories", id, overrideAccess: true });
  return { deleted: true };
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

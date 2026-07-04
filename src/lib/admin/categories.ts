import { getPayloadClient } from "@/lib/payload/get-payload";
import type { AdminCategory } from "./types";
import type {
  CategoryFormOutput,
} from "@/lib/validation/admin/category";

type CategoryDoc = {
  id: string | number;
  name: string;
  slug: string;
  description?: string | null;
  displayOrder?: number | null;
  updatedAt: string;
};

function mapCategory(doc: CategoryDoc): AdminCategory {
  return {
    id: String(doc.id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? undefined,
    displayOrder: doc.displayOrder ?? 0,
    updatedAt: doc.updatedAt,
  };
}

export async function listCategories(): Promise<AdminCategory[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "categories",
    limit: 200,
    sort: "displayOrder",
    depth: 0,
    overrideAccess: true,
  });
  return (result.docs as CategoryDoc[]).map(mapCategory);
}

export async function createCategory(
  input: CategoryFormOutput
): Promise<AdminCategory> {
  const payload = await getPayloadClient();
  const doc = await payload.create({
    collection: "categories",
    data: {
      name: input.name,
      slug: input.slug || undefined,
      description: input.description || undefined,
      displayOrder: input.displayOrder ?? 0,
    } as never,
    overrideAccess: true,
  });
  return mapCategory(doc as CategoryDoc);
}

export async function updateCategory(
  id: string,
  input: Partial<CategoryFormOutput>
): Promise<AdminCategory> {
  const payload = await getPayloadClient();
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.slug) data.slug = input.slug;
  if (input.description !== undefined) data.description = input.description || undefined;
  if (input.displayOrder !== undefined) data.displayOrder = input.displayOrder;

  const doc = await payload.update({
    collection: "categories",
    id,
    data: data as never,
    overrideAccess: true,
  });
  return mapCategory(doc as CategoryDoc);
}

export async function deleteCategory(id: string): Promise<void> {
  const payload = await getPayloadClient();
  await payload.delete({ collection: "categories", id, overrideAccess: true });
}

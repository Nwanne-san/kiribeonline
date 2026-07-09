import { getPayloadClient } from "@/lib/payload/get-payload";
import type { categoryInputSchema } from "./categories.dto";
import type { z } from "zod";

type CategoryInput = z.infer<typeof categoryInputSchema>;

export async function listCategories() {
  const payload = await getPayloadClient();
  return payload.find({
    collection: "categories",
    sort: "displayOrder",
    limit: 100,
    overrideAccess: true,
  });
}

export async function createCategory(input: CategoryInput) {
  const payload = await getPayloadClient();
  return payload.create({
    collection: "categories",
    data: input as never,
    overrideAccess: true,
  });
}

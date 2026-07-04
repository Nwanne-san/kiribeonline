import { getPayloadClient } from "@/lib/payload/get-payload";
import type { AdminTag } from "./types";
import type { TagFormOutput } from "@/lib/validation/admin/tag";

type TagDoc = {
  id: string | number;
  name: string;
  slug: string;
  updatedAt: string;
};

function mapTag(doc: TagDoc): AdminTag {
  return {
    id: String(doc.id),
    name: doc.name,
    slug: doc.slug,
    updatedAt: doc.updatedAt,
  };
}

export async function listTags(): Promise<AdminTag[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "tags",
    limit: 500,
    sort: "name",
    depth: 0,
    overrideAccess: true,
  });
  return (result.docs as TagDoc[]).map(mapTag);
}

export async function createTag(input: TagFormOutput): Promise<AdminTag> {
  const payload = await getPayloadClient();
  const doc = await payload.create({
    collection: "tags",
    data: {
      name: input.name,
      slug: input.slug || undefined,
    } as never,
    overrideAccess: true,
  });
  return mapTag(doc as TagDoc);
}

export async function updateTag(
  id: string,
  input: Partial<TagFormOutput>
): Promise<AdminTag> {
  const payload = await getPayloadClient();
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.slug) data.slug = input.slug;

  const doc = await payload.update({
    collection: "tags",
    id,
    data: data as never,
    overrideAccess: true,
  });
  return mapTag(doc as TagDoc);
}

export async function deleteTag(id: string): Promise<void> {
  const payload = await getPayloadClient();
  await payload.delete({ collection: "tags", id, overrideAccess: true });
}

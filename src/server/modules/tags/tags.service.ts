import { getPayloadClient } from "@/lib/payload/get-payload";
import type { tagInputSchema } from "./tags.dto";
import type { z } from "zod";

type TagInput = z.infer<typeof tagInputSchema>;

export async function listTags() {
  const payload = await getPayloadClient();
  return payload.find({
    collection: "tags",
    sort: "name",
    limit: 200,
    overrideAccess: true,
  });
}

export async function createTag(input: TagInput) {
  const payload = await getPayloadClient();
  return payload.create({
    collection: "tags",
    data: input as never,
    overrideAccess: true,
  });
}

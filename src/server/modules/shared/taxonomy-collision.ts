import type { Where } from "payload";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { DomainError } from "@/server/errors";

/**
 * Pre-check taxonomy name + slug against existing rows so the editor sees a
 * clean 409 ("A category called 'Music' already exists") instead of the raw
 * Postgres unique-violation that Payload otherwise re-throws as a 500.
 *
 * Shared between the categories and tags services because both have the same
 * unique constraints and the same UX requirement.
 */
export async function assertNoTaxonomyCollision(
  collection: "categories" | "tags",
  input: { name?: string; slug?: string },
  excludeId?: string
) {
  const payload = await getPayloadClient();
  const conditions: Where[] = [];
  if (input.name?.trim()) conditions.push({ name: { equals: input.name.trim() } });
  if (input.slug?.trim()) conditions.push({ slug: { equals: input.slug.trim() } });
  if (!conditions.length) return;

  const result = await payload.find({
    collection,
    where: { or: conditions },
    limit: 5,
    depth: 0,
    overrideAccess: true,
  });
  const hits = excludeId
    ? result.docs.filter((d) => String((d as { id: string | number }).id) !== excludeId)
    : result.docs;
  if (!hits.length) return;

  const first = hits[0] as { name?: string; slug?: string };
  const which =
    input.name?.trim() && first.name === input.name.trim() ? "name" : "slug";
  const label = collection === "categories" ? "category" : "tag";
  throw new DomainError(
    `A ${label} with that ${which} already exists ("${first.name ?? first.slug}"). Pick a different ${which}.`,
    409
  );
}

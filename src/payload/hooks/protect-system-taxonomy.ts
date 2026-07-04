import type { CollectionBeforeDeleteHook, CollectionBeforeChangeHook } from "payload";

type TaxonomyDoc = { isSystem?: boolean | null; slug?: string | null };

export const protectSystemTaxonomyBeforeDelete: CollectionBeforeDeleteHook = async ({
  id,
  req,
  collection,
}) => {
  const doc = await req.payload.findByID({
    collection: collection.slug,
    id,
    depth: 0,
    overrideAccess: true,
  });
  if ((doc as TaxonomyDoc)?.isSystem) {
    throw new Error("System categories and tags cannot be deleted.");
  }
};

export const protectSystemTaxonomyBeforeChange: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
}) => {
  const isSystem = (originalDoc as TaxonomyDoc | undefined)?.isSystem;
  if (!isSystem) return data;

  const next = { ...data };
  delete next.slug;
  delete next.isSystem;
  if (originalDoc && "name" in originalDoc) {
    next.name = (originalDoc as { name?: string }).name;
  }
  return next;
};

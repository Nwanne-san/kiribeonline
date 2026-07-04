import type { CollectionAfterChangeHook } from "payload";
import { revalidateTag } from "next/cache";

/** Invalidate cached article lists and homepage when content changes. */
export const revalidateArticlesAfterChange: CollectionAfterChangeHook = async ({
  doc,
  context,
}) => {
  if (context?.skipHooks) return;
  if (doc.status === "published" || doc._status === "published") {
    revalidateTag("articles");
    revalidateTag("homepage");
  }
};

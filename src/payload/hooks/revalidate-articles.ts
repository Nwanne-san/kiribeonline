import type { CollectionAfterChangeHook } from "payload";
import { revalidateTag } from "next/cache";

/** Invalidate cached article lists and homepage when content changes. */
export const revalidateArticlesAfterChange: CollectionAfterChangeHook = async ({
  doc,
  context,
}) => {
  if (context?.skipHooks) return;
  if (doc.status === "published" || doc._status === "published") {
    // revalidateTag only works inside a Next request context. Payload's local
    // API also runs from scripts (seed, cron, e2e) where the static-generation
    // store is absent and Next throws — there's no cache to invalidate there,
    // so a failure must never break the write. Mirrors the homepage hook.
    try {
      revalidateTag("articles");
      revalidateTag("homepage");
    } catch (error) {
      console.warn("[revalidate-articles] revalidateTag failed", error);
    }
  }
};

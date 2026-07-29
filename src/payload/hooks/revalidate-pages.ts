import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from "payload";
import { revalidateTag } from "next/cache";

/**
 * Invalidate cached CMS page reads. Mirrors `revalidate-articles`: the tag call
 * only works inside a Next request context, and Payload's local API also runs
 * from scripts (seed, cron, e2e) where the store is absent — a failure there
 * must never break the write.
 */
function revalidatePages() {
  try {
    revalidateTag("pages");
  } catch (error) {
    console.warn("[revalidate-pages] revalidateTag failed", error);
  }
}

export const revalidatePagesAfterChange: CollectionAfterChangeHook = async ({
  context,
}) => {
  if (context?.skipHooks) return;
  revalidatePages();
};

export const revalidatePagesAfterDelete: CollectionAfterDeleteHook = async () => {
  revalidatePages();
};

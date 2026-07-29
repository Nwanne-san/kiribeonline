import type { GlobalAfterChangeHook } from "payload";
import { revalidateTag } from "next/cache";

/**
 * Site settings drive the header/footer chrome on every public page, so a nav
 * or branding edit has to drop the `site-settings` cache immediately.
 *
 * Same guard as the article/homepage hooks: `revalidateTag` only works inside a
 * Next request context, and Payload's local API also runs from scripts (seed,
 * cron, e2e) where the store is absent — a failure there must not break the
 * write.
 */
export const revalidateSiteChromeAfterChange: GlobalAfterChangeHook = async ({
  context,
}) => {
  if (context?.skipHooks) return;
  try {
    revalidateTag("site-settings");
  } catch (error) {
    console.warn("[revalidate-site-chrome] revalidateTag failed", error);
  }
};

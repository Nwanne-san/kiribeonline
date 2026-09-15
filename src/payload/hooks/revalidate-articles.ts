import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeDeleteHook,
} from "payload";
import { revalidateTag } from "next/cache";

/**
 * revalidateTag only works inside a Next request context. Payload's local API
 * also runs from scripts (seed, cron, e2e) where the static-generation store
 * is absent and Next throws — there's no cache to invalidate there, so a
 * failure must never break the write.
 */
function bustArticleCaches() {
  try {
    revalidateTag("articles");
    revalidateTag("homepage");
  } catch (error) {
    console.warn("[revalidate-articles] revalidateTag failed", error);
  }
}

/** Invalidate cached article lists and homepage when content changes. */
export const revalidateArticlesAfterChange: CollectionAfterChangeHook = async ({
  doc,
  context,
}) => {
  if (context?.skipHooks) return;
  if (doc.status === "published" || doc._status === "published") {
    bustArticleCaches();
  }
};

/**
 * Before the article row is deleted, scrub every homepage reference to it.
 * `homepage.heroArticle` is nullable and can just be cleared. `editorsPicks`
 * carries a required (NOT NULL) `article` relation, so a delete without this
 * pre-step trips a FK constraint and rolls the whole delete back — that's the
 * bug that surfaced when a bulk cleanup left "deleted" articles still visible
 * on the homepage. We filter the pick out entirely instead.
 *
 * Runs with `skipHooks` in the update `context` so the homepage's own
 * afterChange hook doesn't re-audit/re-revalidate — we do that ourselves in
 * `revalidateArticlesAfterDelete`.
 */
export const scrubHomepageBeforeArticleDelete: CollectionBeforeDeleteHook = async ({
  id,
  req,
}) => {
  const payload = req.payload;
  try {
    const homepage = (await payload.findGlobal({
      slug: "homepage",
      depth: 0,
      overrideAccess: true,
    })) as {
      heroArticle?: string | number | null;
      editorsPicks?: Array<{ article?: string | number; sortOrder?: number }>;
    };

    const heroMatches =
      homepage.heroArticle != null && String(homepage.heroArticle) === String(id);
    const nextPicks = (homepage.editorsPicks ?? []).filter(
      (pick) => String(pick.article) !== String(id),
    );
    const picksChanged = nextPicks.length !== (homepage.editorsPicks?.length ?? 0);

    if (!heroMatches && !picksChanged) return;

    await payload.updateGlobal({
      slug: "homepage",
      data: {
        ...(heroMatches ? { heroArticle: null } : {}),
        ...(picksChanged ? { editorsPicks: nextPicks } : {}),
      } as never,
      overrideAccess: true,
      context: { skipHooks: true },
    });
  } catch (error) {
    // A failure here would leave the delete to trip the FK constraint below,
    // which is louder than a silent orphan — surface both so the caller can act.
    console.error("[revalidate-articles] scrub homepage before delete failed", error);
    throw error;
  }
};

/** Bust caches after an article is deleted so the homepage/list stops showing it. */
export const revalidateArticlesAfterDelete: CollectionAfterDeleteHook = async ({
  context,
}) => {
  if (context?.skipHooks) return;
  bustArticleCaches();
};

import type { ArticleListResult } from "@/lib/content/types";

/** Flatten paginated docs from infinite query pages. */
export function mergeInfinitePages<TDoc>(
  pages: ArticleListResult<TDoc>[] | undefined
): TDoc[] {
  if (!pages?.length) return [];
  return pages.flatMap((page) => page.docs);
}

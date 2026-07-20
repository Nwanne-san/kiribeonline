import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminCapability,
} from "@/server/auth";
import { isArticleSlugAvailable } from "@/server/modules/articles";

export const dynamic = "force-dynamic";

/**
 * Cheap slug-uniqueness probe for the editor's inline validator. Requires
 * `articles:edit` (the same capability the editor itself needs) — never
 * exposed publicly, since it doubles as a way to enumerate what article
 * URLs exist.
 *
 * Query: `?slug=<candidate>&excludeId=<article-id>` (excludeId lets the
 * editor screen ignore the article's own row on save-in-place).
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminCapability(request, "articles:edit");
    const params = request.nextUrl.searchParams;
    const slug = params.get("slug")?.trim();
    if (!slug) {
      return apiError("Missing slug", 400);
    }
    // Guardrail — the DB column is 200-char text; anything longer is a
    // client bug, not a real slug.
    if (slug.length > 200) {
      return apiError("Slug too long", 400);
    }
    const excludeId = params.get("excludeId") ?? undefined;
    const available = await isArticleSlugAvailable(slug, excludeId);
    return apiSuccess({ available });
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

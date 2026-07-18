import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminWriteCapability,
} from "@/server/auth";
import { bulkUpdateArticles } from "@/server/modules/articles";
import { can, type Capability } from "@/server/access/roles";

export const dynamic = "force-dynamic";

const bulkSchema = z.object({
  ids: z.array(z.union([z.string(), z.number()]).transform(String)).min(1).max(100),
  action: z.enum(["publish", "unpublish", "archive", "delete"]),
});

/**
 * Each bulk action maps to the capability its single-article equivalent needs.
 * `archive` and `unpublish` are publish-state transitions, so they require
 * `articles:publish` — matching the single-article PATCH rule (a writer with
 * only `articles:edit` must not take published content offline in bulk).
 */
const ACTION_CAPABILITY: Record<z.infer<typeof bulkSchema>["action"], Capability> = {
  publish: "articles:publish",
  unpublish: "articles:publish",
  archive: "articles:publish",
  delete: "articles:delete",
};

export async function POST(request: NextRequest) {
  try {
    // Auth + rate-limit + base edit capability first, then parse the payload.
    const user = await requireAdminWriteCapability(request, "articles:edit");
    const body = await request.json();
    const { ids, action } = parseBody(bulkSchema, body);
    if (!can(user.role, ACTION_CAPABILITY[action])) {
      return apiError("Forbidden", 403);
    }
    const result = await bulkUpdateArticles(ids, action);
    return apiSuccess(result);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

import type { NextRequest } from "next/server";
import { apiError, apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminUserFromRequest,
  requireAdminWriteCapability,
} from "@/server/auth";
import { can, isEditorOrAbove } from "@/server/access/roles";
import {
  createAdminArticle,
  listAdminArticles,
} from "@/server/modules/articles";
import { articleInputSchema } from "@/server/modules";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUserFromRequest(request);
    const params = request.nextUrl.searchParams;
    const sortParam = params.get("sort");
    const result = await listAdminArticles({
      status: params.get("status") ?? undefined,
      q: params.get("q") ?? undefined,
      categoryId: params.get("categoryId") ?? undefined,
      authorId: params.get("authorId") ?? undefined,
      publishedFrom: params.get("publishedFrom") ?? undefined,
      publishedTo: params.get("publishedTo") ?? undefined,
      sort: sortParam === "newest" || sortParam === "oldest" ? sortParam : undefined,
      page: params.get("page") ? Number(params.get("page")) : undefined,
      limit: params.get("limit") ? Number(params.get("limit")) : undefined,
    });
    return apiSuccess(result);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdminWriteCapability(request, "articles:create");
    const body = await request.json();
    const input = parseBody(articleInputSchema, body);
    // Creating straight into published/scheduled/archived — or onto the
    // homepage via featured — is a publish action, not a create action.
    // Mirrors the PATCH escalation guard.
    const wantsPublish =
      input.status === "published" ||
      input.status === "scheduled" ||
      input.status === "archived" ||
      input.featured === true ||
      (input.featuredPriority ?? 0) > 0;
    if (wantsPublish && !can(user.role, "articles:publish")) {
      return apiError("Forbidden", 403);
    }
    // Ownership scope: writers/contributors may only file under their own
    // byline; editors may file for anyone. See DECISIONS.md.
    if (
      !isEditorOrAbove(user.role) &&
      input.authorId !== undefined &&
      input.authorId !== null &&
      String(input.authorId) !== String(user.id)
    ) {
      return apiError("Forbidden", 403);
    }
    // Default attribution to the creating user so articles are never
    // unassigned; an explicit authorId (e.g. an editor filing for someone
    // else) still wins.
    const doc = await createAdminArticle({ ...input, authorId: input.authorId ?? user.id });
    return apiSuccess(doc);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

import type { NextRequest } from "next/server";
import { apiError, apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminUserFromRequest,
  requireAdminWriteCapability,
} from "@/server/auth";
import {
  deleteAdminArticle,
  getAdminArticle,
  getAdminArticleAuthorId,
  updateAdminArticle,
} from "@/server/modules/articles";
import { articlePatchSchema } from "@/server/modules";
import { can, isEditorOrAbove } from "@/server/access/roles";

export const dynamic = "force-dynamic";

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminUserFromRequest(request);
    const { id } = await params;
    const doc = await getAdminArticle(id);
    return apiSuccess(doc);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  try {
    // Auth + rate-limit + base edit capability first, then parse the payload.
    const user = await requireAdminWriteCapability(request, "articles:edit");
    const { id } = await params;
    const body = await request.json();
    const input = parseBody(articlePatchSchema, body);
    // A status change into/out of published — including scheduled, which the
    // cron later publishes — or homepage exposure via featured, requires the
    // stronger capability.
    const wantsPublish =
      input.status === "published" ||
      input.status === "scheduled" ||
      input.status === "archived" ||
      input.featured === true ||
      (input.featuredPriority !== undefined && input.featuredPriority > 0);
    if (wantsPublish && !can(user.role, "articles:publish")) {
      return apiError("Forbidden", 403);
    }
    // Ownership scope: writers/contributors may only edit their own articles.
    // Reassigning author to someone else (or null-ing it out) is editor-only —
    // otherwise a writer could hand off (or launder) authorship. See DECISIONS.md.
    if (!isEditorOrAbove(user.role)) {
      const authorId = await getAdminArticleAuthorId(id);
      if (!authorId || authorId !== String(user.id)) {
        return apiError("Forbidden", 403);
      }
      if (
        input.authorId !== undefined &&
        (input.authorId === null || String(input.authorId) !== String(user.id))
      ) {
        return apiError("Forbidden", 403);
      }
    }
    const doc = await updateAdminArticle(id, input, {
      actor: { id: user.id, name: user.name ?? null },
    });
    return apiSuccess(doc);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteProps) {
  try {
    const user = await requireAdminWriteCapability(request, "articles:delete");
    const { id } = await params;
    // Ownership scope: non-editors need `articles:delete` AND ownership. The
    // capability check above already excludes writer/contributor today, but
    // keep the ownership guard here so a future capability grant stays safe.
    if (!isEditorOrAbove(user.role)) {
      const authorId = await getAdminArticleAuthorId(id);
      if (!authorId || authorId !== String(user.id)) {
        return apiError("Forbidden", 403);
      }
    }
    await deleteAdminArticle(id);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

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
  updateAdminArticle,
} from "@/server/modules/articles";
import { articlePatchSchema } from "@/server/modules";
import { can } from "@/server/access/roles";

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
    const doc = await updateAdminArticle(id, input);
    return apiSuccess(doc);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminWriteCapability(request, "articles:delete");
    const { id } = await params;
    await deleteAdminArticle(id);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

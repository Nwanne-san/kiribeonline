import type { NextRequest } from "next/server";
import { apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminUserFromRequest,
  requireAdminWrite,
} from "@/lib/auth";
import {
  deleteAdminArticle,
  getAdminArticle,
  updateAdminArticle,
} from "@/lib/admin/articles";
import { articlePatchSchema } from "@/lib/validation/admin";

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
    await requireAdminWrite(request);
    const { id } = await params;
    const body = await request.json();
    const input = parseBody(articlePatchSchema, body);
    const doc = await updateAdminArticle(id, input);
    return apiSuccess(doc);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminWrite(request);
    const { id } = await params;
    await deleteAdminArticle(id);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

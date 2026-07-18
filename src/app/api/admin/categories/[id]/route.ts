import type { NextRequest } from "next/server";
import { apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminWriteCapability,
} from "@/server/auth";
import { deleteCategory, updateCategory } from "@/server/modules/categories";
import { categoryUpdateInputSchema } from "@/server/modules/categories/categories.dto";

export const dynamic = "force-dynamic";

type RouteProps = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminWriteCapability(request, "taxonomy:manage");
    const { id } = await params;
    const body = await request.json();
    const input = parseBody(categoryUpdateInputSchema, body);
    const doc = await updateCategory(id, input);
    return apiSuccess(doc);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminWriteCapability(request, "taxonomy:manage");
    const { id } = await params;
    const result = await deleteCategory(id);
    return apiSuccess(result);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

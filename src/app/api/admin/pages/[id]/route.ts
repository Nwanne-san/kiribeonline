import type { NextRequest } from "next/server";
import { apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminUserFromRequest,
  requireAdminWriteCapability,
} from "@/server/auth";
import {
  deletePageAdmin,
  getPageAdmin,
  pageUpdateSchema,
  updatePageAdmin,
} from "@/server/modules/pages";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUserFromRequest(request);
    const { id } = await params;
    return apiSuccess(await getPageAdmin(id));
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminWriteCapability(request, "settings:manage");
    const { id } = await params;
    const input = parseBody(pageUpdateSchema, await request.json());
    return apiSuccess(await updatePageAdmin(id, input));
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminWriteCapability(request, "settings:manage");
    const { id } = await params;
    return apiSuccess(await deletePageAdmin(id));
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

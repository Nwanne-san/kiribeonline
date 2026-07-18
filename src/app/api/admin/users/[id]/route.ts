import type { NextRequest } from "next/server";
import { apiError, apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminCapability,
  requireAdminWriteCapability,
} from "@/server/auth";
import {
  deleteAdminUser,
  getAdminUser,
  updateAdminUser,
} from "@/server/modules/users";
import { userUpdateSchema } from "@/server/modules";

export const dynamic = "force-dynamic";

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminCapability(request, "users:manage");
    const { id } = await params;
    const doc = await getAdminUser(id);
    return apiSuccess(doc);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  try {
    const actor = await requireAdminWriteCapability(request, "users:manage");
    const { id } = await params;
    const body = await request.json();
    const input = parseBody(userUpdateSchema, body);

    // An admin cannot demote or suspend their own account and lock themselves
    // out of user management.
    if (String(actor.id) === String(id) && (input.role || input.status)) {
      return apiError("You cannot change your own role or status.", 400);
    }

    const doc = await updateAdminUser(id, input);
    return apiSuccess(doc);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteProps) {
  try {
    const actor = await requireAdminWriteCapability(request, "users:manage");
    const { id } = await params;
    if (String(actor.id) === String(id)) {
      return apiError("You cannot delete your own account.", 400);
    }
    const result = await deleteAdminUser(id);
    return apiSuccess(result);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

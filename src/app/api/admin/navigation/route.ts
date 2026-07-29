import type { NextRequest } from "next/server";
import { apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminUserFromRequest,
  requireAdminWriteCapability,
} from "@/server/auth";
import {
  getNavigationAdmin,
  navigationPatchSchema,
  updateNavigationAdmin,
} from "@/server/modules/navigation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUserFromRequest(request);
    return apiSuccess(await getNavigationAdmin());
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdminWriteCapability(request, "settings:manage");
    const input = parseBody(navigationPatchSchema, await request.json());
    return apiSuccess(await updateNavigationAdmin(input));
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminUserFromRequest,
  requireAdminWriteCapability,
} from "@/server/auth";
import { getDefaultNavigationChrome } from "@/server/modules/navigation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUserFromRequest(request);
    return apiSuccess(getDefaultNavigationChrome());
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdminWriteCapability(request, "settings:manage");
    return apiError("Navigation persistence landing soon", 501);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

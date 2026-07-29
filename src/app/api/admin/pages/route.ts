import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminUserFromRequest,
  requireAdminWriteCapability,
} from "@/server/auth";
import { listStubPages } from "@/server/modules/pages";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUserFromRequest(request);
    return apiSuccess(listStubPages());
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function POST(_request: NextRequest) {
  try {
    await requireAdminWriteCapability(_request, "settings:manage");
    return apiError("Pages CMS landing soon", 501);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function PATCH(_request: NextRequest) {
  try {
    await requireAdminWriteCapability(_request, "settings:manage");
    return apiError("Pages CMS landing soon", 501);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

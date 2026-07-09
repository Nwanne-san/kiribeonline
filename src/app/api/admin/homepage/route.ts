import type { NextRequest } from "next/server";
import { apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminUserFromRequest,
  requireAdminWrite,
} from "@/server/auth";
import { getHomepageAdmin, updateHomepageAdmin } from "@/server/modules/homepage";
import { homepagePatchSchema } from "@/server/modules";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUserFromRequest(request);
    const data = await getHomepageAdmin();
    return apiSuccess(data);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdminWrite(request);
    const body = await request.json();
    const input = parseBody(homepagePatchSchema, body);
    const data = await updateHomepageAdmin(input);
    return apiSuccess(data);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

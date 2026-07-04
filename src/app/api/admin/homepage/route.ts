import type { NextRequest } from "next/server";
import { apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminUserFromRequest,
  requireAdminWrite,
} from "@/lib/auth";
import { getHomepageAdmin, updateHomepageAdmin } from "@/lib/admin/homepage";
import { homepagePatchSchema } from "@/lib/validation/admin";

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

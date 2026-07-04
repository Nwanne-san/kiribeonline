import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api";
import { handleAdminRouteError, requireAdminUserFromRequest } from "@/lib/auth";
import { getAnalyticsData } from "@/lib/admin/analytics";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUserFromRequest(request);
    const data = await getAnalyticsData();
    return apiSuccess(data);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

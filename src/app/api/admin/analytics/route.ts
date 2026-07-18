import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api";
import { handleAdminRouteError, requireAdminCapability } from "@/server/auth";
import { getAnalyticsData } from "@/server/modules/analytics";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminCapability(request, "analytics:read");
    const data = await getAnalyticsData();
    return apiSuccess(data);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

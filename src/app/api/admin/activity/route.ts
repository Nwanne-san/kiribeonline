import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api";
import { handleAdminRouteError, requireAdminCapability } from "@/server/auth";
import { listActivity } from "@/server/modules/dashboard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Same gate as the dashboard: audit activity is analytics:read.
    await requireAdminCapability(request, "analytics:read");
    const limitParam = Number(request.nextUrl.searchParams.get("limit"));
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 50;
    const items = await listActivity(limit);
    return apiSuccess(items);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

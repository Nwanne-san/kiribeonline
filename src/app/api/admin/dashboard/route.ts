import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api";
import { handleAdminRouteError, requireAdminCapability } from "@/server/auth";
import { getDashboardStats } from "@/server/modules/dashboard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Dashboard exposes audit activity + performance metrics — gated on
    // analytics:read (contributors do not receive this capability).
    await requireAdminCapability(request, "analytics:read");
    const stats = await getDashboardStats();
    return apiSuccess(stats);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

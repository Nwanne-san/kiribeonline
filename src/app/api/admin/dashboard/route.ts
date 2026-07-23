import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api";
import { handleAdminRouteError, requireAdminCapability } from "@/server/auth";
import { can } from "@/server/access/roles";
import { getDashboardStats } from "@/server/modules/dashboard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Dashboard tiles are gated on analytics:read (contributors do not receive
    // this capability). The recent-activity tile is stricter: it exposes other
    // users' actions and auth events, so we only include it when the caller
    // also holds `audit:view` — otherwise the client tile shows an empty state.
    const user = await requireAdminCapability(request, "analytics:read");
    const stats = await getDashboardStats({ includeActivity: can(user.role, "audit:view") });
    return apiSuccess(stats);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

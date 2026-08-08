import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api";
import { handleAdminRouteError, requireAdminUserFromRequest } from "@/server/auth";
import { can } from "@/server/access/roles";
import { getDashboardStats } from "@/server/modules/dashboard";

export const dynamic = "force-dynamic";

/**
 * Dashboard data is available to every authenticated admin. The set of
 * tiles/panels the response actually populates depends on capability:
 *
 * - `analytics:read`  — populates total-views + content-performance list;
 *                       without it, both are zeroed/emptied and the client
 *                       hides the matching panels.
 * - `audit:view`      — populates recent activity (other users' actions).
 * - `settings:manage` — populates unread-messages count (admin correspondence).
 *
 * Everything else (article-status counters, categories/tags/media counts,
 * recent articles, scheduled posts) is scoped globally and stays visible.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdminUserFromRequest(request);
    const stats = await getDashboardStats({
      includeActivity: can(user.role, "audit:view"),
      includeAnalytics: can(user.role, "analytics:read"),
      includeMessages: can(user.role, "settings:manage"),
    });
    return apiSuccess(stats);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

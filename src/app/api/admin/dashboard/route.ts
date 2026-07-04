import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api";
import { handleAdminRouteError, requireAdminUserFromRequest } from "@/lib/auth";
import { getDashboardStats } from "@/lib/admin/articles";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUserFromRequest(request);
    const stats = await getDashboardStats();
    return apiSuccess(stats);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api";
import { handleAdminRouteError, requireAdminCapability } from "@/server/auth";
import { listAuditTargetTypes } from "@/server/modules/audit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminCapability(request, "audit:view");
    const types = await listAuditTargetTypes();
    return apiSuccess(types);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

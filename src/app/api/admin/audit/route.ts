import type { NextRequest } from "next/server";
import { apiSuccess, parseBody } from "@/lib/api";
import { handleAdminRouteError, requireAdminCapability } from "@/server/auth";
import { auditListQuerySchema, listAuditLogs } from "@/server/modules/audit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminCapability(request, "audit:view");
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = parseBody(auditListQuerySchema, params);
    const result = await listAuditLogs(query);
    return apiSuccess(result);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

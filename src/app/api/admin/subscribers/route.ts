import type { NextRequest } from "next/server";
import { apiSuccess, parseBody } from "@/lib/api";
import { handleAdminRouteError, requireAdminCapability } from "@/server/auth";
import { listSubscribers, subscriberListQuerySchema } from "@/server/modules/subscribers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminCapability(request, "subscribers:manage");
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = parseBody(subscriberListQuerySchema, params);
    const result = await listSubscribers(query);
    return apiSuccess(result);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

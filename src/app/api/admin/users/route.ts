import type { NextRequest } from "next/server";
import { apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminCapability,
  requireAdminWriteCapability,
} from "@/server/auth";
import { inviteAdminUser, listAdminUsers } from "@/server/modules/users";
import { userInviteSchema } from "@/server/modules";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminCapability(request, "users:manage");
    const params = request.nextUrl.searchParams;
    const result = await listAdminUsers({
      role: params.get("role") ?? undefined,
      status: params.get("status") ?? undefined,
      q: params.get("q") ?? undefined,
      page: params.get("page") ? Number(params.get("page")) : undefined,
      limit: params.get("limit") ? Number(params.get("limit")) : undefined,
    });
    return apiSuccess(result);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminWriteCapability(request, "users:manage");
    const body = await request.json();
    const input = parseBody(userInviteSchema, body);
    const doc = await inviteAdminUser(input);
    return apiSuccess(doc);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

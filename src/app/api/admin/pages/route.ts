import type { NextRequest } from "next/server";
import { apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminUserFromRequest,
  requireAdminWriteCapability,
} from "@/server/auth";
import {
  createPageAdmin,
  listPagesAdmin,
  pageCreateSchema,
} from "@/server/modules/pages";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUserFromRequest(request);
    return apiSuccess(await listPagesAdmin());
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminWriteCapability(request, "settings:manage");
    const input = parseBody(pageCreateSchema, await request.json());
    return apiSuccess(await createPageAdmin(input));
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

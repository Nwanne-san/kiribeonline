import type { NextRequest } from "next/server";
import { apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminUserFromRequest,
  requireAdminWrite,
} from "@/lib/auth";
import { createCategoryAdmin, listCategoriesAdmin } from "@/lib/admin/homepage";
import { categoryInputSchema } from "@/lib/validation/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUserFromRequest(request);
    const result = await listCategoriesAdmin();
    return apiSuccess(result);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminWrite(request);
    const body = await request.json();
    const input = parseBody(categoryInputSchema, body);
    const doc = await createCategoryAdmin(input);
    return apiSuccess(doc);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

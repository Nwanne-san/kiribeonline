import type { NextRequest } from "next/server";
import { apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminUserFromRequest,
  requireAdminWriteCapability,
} from "@/server/auth";
import { createCategory, listCategories } from "@/server/modules/categories";
import { categoryInputSchema } from "@/server/modules/categories/categories.dto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUserFromRequest(request);
    const result = await listCategories();
    return apiSuccess(result);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminWriteCapability(request, "taxonomy:manage");
    const body = await request.json();
    const input = parseBody(categoryInputSchema, body);
    const doc = await createCategory(input);
    return apiSuccess(doc);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

import type { NextRequest } from "next/server";
import { apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminWriteCapability,
} from "@/server/auth";
import { reorderCategories } from "@/server/modules/categories";
import { categoryReorderSchema } from "@/server/modules/categories/categories.dto";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  try {
    await requireAdminWriteCapability(request, "taxonomy:manage");
    const body = await request.json();
    const { ids } = parseBody(categoryReorderSchema, body);
    const result = await reorderCategories(ids);
    return apiSuccess(result);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

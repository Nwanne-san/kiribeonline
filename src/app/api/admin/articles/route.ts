import type { NextRequest } from "next/server";
import { apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminUserFromRequest,
  requireAdminWrite,
} from "@/lib/auth";
import {
  createAdminArticle,
  listAdminArticles,
} from "@/lib/admin/articles";
import { articleInputSchema } from "@/lib/validation/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUserFromRequest(request);
    const status = request.nextUrl.searchParams.get("status") ?? undefined;
    const result = await listAdminArticles({ status: status ?? undefined });
    return apiSuccess(result);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminWrite(request);
    const body = await request.json();
    const input = parseBody(articleInputSchema, body);
    const doc = await createAdminArticle(input);
    return apiSuccess(doc);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

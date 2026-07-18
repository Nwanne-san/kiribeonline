import type { NextRequest } from "next/server";
import { apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminUserFromRequest,
  requireAdminWriteCapability,
} from "@/server/auth";
import {
  createAdminArticle,
  listAdminArticles,
} from "@/server/modules/articles";
import { articleInputSchema } from "@/server/modules";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUserFromRequest(request);
    const params = request.nextUrl.searchParams;
    const sortParam = params.get("sort");
    const result = await listAdminArticles({
      status: params.get("status") ?? undefined,
      q: params.get("q") ?? undefined,
      categoryId: params.get("categoryId") ?? undefined,
      authorId: params.get("authorId") ?? undefined,
      sort: sortParam === "newest" || sortParam === "oldest" ? sortParam : undefined,
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
    await requireAdminWriteCapability(request, "articles:create");
    const body = await request.json();
    const input = parseBody(articleInputSchema, body);
    const doc = await createAdminArticle(input);
    return apiSuccess(doc);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

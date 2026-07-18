import type { NextRequest } from "next/server";
import { apiSuccess, handleRouteError } from "@/lib/api";
import { getClientIp } from "@/server/auth";
import { queryArticles } from "@/lib/content";
import { DEFAULT_ARTICLES_RATE_LIMIT, RATE_LIMIT_WINDOW_MS } from "@/constants";
import { rateLimitForEndpoint, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limit = await rateLimitForEndpoint(
      "articles",
      ip,
      DEFAULT_ARTICLES_RATE_LIMIT,
      RATE_LIMIT_WINDOW_MS
    );

    if (!limit.allowed) {
      return tooManyRequests(limit);
    }

    const { searchParams } = request.nextUrl;
    const result = await queryArticles({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      categorySlug: searchParams.get("category") ?? undefined,
      tagSlug: searchParams.get("tag") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
    });

    return apiSuccess(result, undefined, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

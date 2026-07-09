import type { NextRequest } from "next/server";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api";
import { getClientIp } from "@/server/auth";
import { isSearchQueryValid, queryArticles } from "@/lib/content";
import {
  DEFAULT_SEARCH_RATE_LIMIT,
  MIN_SEARCH_LENGTH,
  RATE_LIMIT_WINDOW_MS,
} from "@/constants";
import { rateLimitForEndpoint, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimit = await rateLimitForEndpoint(
      "search",
      ip,
      DEFAULT_SEARCH_RATE_LIMIT,
      RATE_LIMIT_WINDOW_MS
    );

    if (!rateLimit.allowed) {
      return tooManyRequests(rateLimit);
    }

    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q")?.trim() ?? "";

    if (!isSearchQueryValid(q)) {
      return apiError(`Search query must be at least ${MIN_SEARCH_LENGTH} characters.`, 400);
    }

    const result = await queryArticles({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      q,
      sort: searchParams.get("sort") ?? undefined,
    });

    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

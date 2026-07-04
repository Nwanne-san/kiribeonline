import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { getCategoriesForPublic } from "@/lib/content/query-categories";
import { getClientIp } from "@/lib/auth";
import { DEFAULT_ARTICLES_RATE_LIMIT, RATE_LIMIT_WINDOW_MS } from "@/constants";
import { rateLimitForEndpoint, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limit = await rateLimitForEndpoint(
      "categories",
      ip,
      DEFAULT_ARTICLES_RATE_LIMIT,
      RATE_LIMIT_WINDOW_MS
    );
    if (!limit.allowed) {
      return tooManyRequests(limit);
    }

    const docs = await getCategoriesForPublic();
    return NextResponse.json({ docs });
  } catch (error) {
    return handleRouteError(error);
  }
}

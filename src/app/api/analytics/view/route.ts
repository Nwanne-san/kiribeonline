import type { NextRequest } from "next/server";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api";
import { getClientIp } from "@/server/auth";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { DEFAULT_ANALYTICS_VIEW_RATE_LIMIT, RATE_LIMIT_WINDOW_MS } from "@/constants";
import { rateLimitForEndpoint, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limit = await rateLimitForEndpoint(
      "analytics_view",
      ip,
      DEFAULT_ANALYTICS_VIEW_RATE_LIMIT,
      RATE_LIMIT_WINDOW_MS
    );
    if (!limit.allowed) {
      return tooManyRequests(limit);
    }

    const body = await request.json();
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    if (!slug) {
      return apiError("Missing slug.", 400);
    }

    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: "articles",
      where: {
        and: [{ slug: { equals: slug } }, { status: { equals: "published" } }],
      },
      limit: 1,
      overrideAccess: true,
    });

    const article = docs[0];
    if (!article) {
      return apiSuccess({ updated: false });
    }

    const current = typeof article.viewCount === "number" ? article.viewCount : 0;
    await payload.update({
      collection: "articles",
      id: article.id,
      data: { viewCount: current + 1 },
      overrideAccess: true,
    });

    return apiSuccess({ updated: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

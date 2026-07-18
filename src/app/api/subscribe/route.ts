import type { NextRequest } from "next/server";
import { apiSuccess, handleRouteError, parseBody } from "@/lib/api";
import { getClientIp } from "@/server/auth";
import { subscribeFormSchema } from "@/lib/validation/subscribe";
import { DEFAULT_SUBSCRIBE_RATE_LIMIT, RATE_LIMIT_WINDOW_15_MIN_MS } from "@/constants";
import { rateLimitForEndpoint, tooManyRequests } from "@/lib/rate-limit";
import { submitSubscribe } from "@/services/subscribe.service";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limit = await rateLimitForEndpoint(
      "subscribe",
      ip,
      DEFAULT_SUBSCRIBE_RATE_LIMIT,
      RATE_LIMIT_WINDOW_15_MIN_MS
    );

    if (!limit.allowed) {
      return tooManyRequests(limit);
    }

    const body = await request.json();
    const input = parseBody(subscribeFormSchema, body);
    const result = await submitSubscribe(input);

    return apiSuccess(result, result.message);
  } catch (error) {
    return handleRouteError(error);
  }
}

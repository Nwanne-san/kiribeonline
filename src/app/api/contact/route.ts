import type { NextRequest } from "next/server";
import { apiSuccess, handleRouteError, parseBody } from "@/lib/api";
import { getClientIp } from "@/server/auth";
import { contactFormSchema } from "@/lib/validation/contact";
import { DEFAULT_CONTACT_RATE_LIMIT, RATE_LIMIT_WINDOW_15_MIN_MS } from "@/constants";
import { rateLimitForEndpoint, tooManyRequests } from "@/lib/rate-limit";
import { submitContactMessage } from "@/services/contact.service";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limit = await rateLimitForEndpoint(
      "contact",
      ip,
      DEFAULT_CONTACT_RATE_LIMIT,
      RATE_LIMIT_WINDOW_15_MIN_MS
    );

    if (!limit.allowed) {
      return tooManyRequests(limit);
    }

    const body = await request.json();
    const input = parseBody(contactFormSchema, body);
    const result = await submitContactMessage(input, ip);

    return apiSuccess(result, result.message);
  } catch (error) {
    return handleRouteError(error);
  }
}

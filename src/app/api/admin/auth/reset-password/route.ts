import type { NextRequest } from "next/server";
import { apiError, apiSuccess, handleRouteError, parseBody } from "@/lib/api";
import { getClientIp } from "@/server/auth";
import { completePasswordReset } from "@/server/modules/users";
import { resetPasswordSchema } from "@/server/modules/users/users.dto";
import {
  DEFAULT_ADMIN_RESET_SUBMIT_RATE_LIMIT,
  RATE_LIMIT_WINDOW_MS,
} from "@/constants";
import { rateLimitForEndpoint, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Public endpoint — the single-use reset token IS the credential. IP rate-limited
 * to blunt token guessing, and the error is generic (no signal on whether a
 * token exists vs is expired vs targets a suspended account).
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limit = await rateLimitForEndpoint(
      "admin_reset_password",
      ip,
      DEFAULT_ADMIN_RESET_SUBMIT_RATE_LIMIT,
      RATE_LIMIT_WINDOW_MS
    );
    if (!limit.allowed) {
      return tooManyRequests(limit, "Too many attempts. Try again in a minute.");
    }

    const body = await request.json();
    const { token, password } = parseBody(resetPasswordSchema, body);

    const result = await completePasswordReset(token, password);
    if (!result) {
      return apiError("This reset link is invalid or has expired.", 400);
    }

    return apiSuccess({ reset: true, email: result.email });
  } catch (error) {
    return handleRouteError(error);
  }
}

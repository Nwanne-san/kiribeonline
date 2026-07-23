import type { NextRequest } from "next/server";
import { apiError, apiSuccess, handleRouteError, parseBody } from "@/lib/api";
import { getClientIp } from "@/server/auth";
import { acceptInvite } from "@/server/modules/users";
import { acceptInviteSchema } from "@/server/modules/users/users.dto";
import {
  DEFAULT_ADMIN_LOGIN_RATE_LIMIT,
  RATE_LIMIT_WINDOW_15_MIN_MS,
} from "@/constants";
import { rateLimitForEndpoint, tooManyRequests } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/server/security";

export const dynamic = "force-dynamic";

/**
 * Public endpoint — the single-use invite token IS the credential, so there is
 * no session yet. IP rate-limited to blunt token guessing, and errors are
 * generic (no signal on whether a token exists).
 */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request);
    const limit = await rateLimitForEndpoint(
      "admin_accept_invite",
      ip,
      DEFAULT_ADMIN_LOGIN_RATE_LIMIT,
      RATE_LIMIT_WINDOW_15_MIN_MS
    );
    if (!limit.allowed) {
      return tooManyRequests(limit, "Too many attempts. Try again later.");
    }

    const body = await request.json();
    const { token, password } = parseBody(acceptInviteSchema, body);

    const result = await acceptInvite(token, password);
    if (!result) {
      return apiError("This invite link is invalid or has expired.", 400);
    }

    return apiSuccess({ activated: true, email: result.email });
  } catch (error) {
    return handleRouteError(error);
  }
}

import type { NextRequest } from "next/server";
import { apiSuccess, handleRouteError, parseBody } from "@/lib/api";
import { getClientIp } from "@/server/auth";
import { requestPasswordReset } from "@/server/modules/users";
import { forgotPasswordSchema } from "@/server/modules/users/users.dto";
import {
  DEFAULT_ADMIN_SENSITIVE_RATE_LIMIT,
  RATE_LIMIT_WINDOW_1_HOUR_MS,
  RATE_LIMIT_WINDOW_MS,
} from "@/constants";
import { rateLimitForEndpoint, tooManyRequests } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/server/security";

export const dynamic = "force-dynamic";

/** Same generic message the client is shown on both the hit and miss paths. */
const GENERIC_MESSAGE =
  "If an account exists for that email, a reset link is on its way.";

/** Per-email cap so a single mailbox can't be turned into a spam vector. */
const PER_EMAIL_LIMIT = 3;

/**
 * Public endpoint. Deliberately says the same thing on every branch — success,
 * unknown email, inactive account, rate-limit trip — so it cannot be used to
 * enumerate accounts. AUTH-HARDENING §8.
 *
 * Two rate-limit buckets:
 *  - per IP (5/min sensitive) blunts a single attacker sweeping addresses
 *  - per email (3/hour) prevents someone else's mailbox being used as a
 *    delivery weapon regardless of source IP
 */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request);
    const ipLimit = await rateLimitForEndpoint(
      "admin_forgot_password",
      ip,
      DEFAULT_ADMIN_SENSITIVE_RATE_LIMIT,
      RATE_LIMIT_WINDOW_MS
    );
    if (!ipLimit.allowed) {
      return tooManyRequests(ipLimit, "Too many requests. Try again in a minute.");
    }

    const body = await request.json();
    const { email } = parseBody(forgotPasswordSchema, body);

    const emailLimit = await rateLimitForEndpoint(
      "admin_forgot_password_email",
      email.toLowerCase(),
      PER_EMAIL_LIMIT,
      RATE_LIMIT_WINDOW_1_HOUR_MS
    );
    // Even on the per-email trip, return the generic success shape — otherwise
    // a probe learns whether an address has been asked for recently.
    if (!emailLimit.allowed) {
      return apiSuccess({ requested: true }, GENERIC_MESSAGE);
    }

    await requestPasswordReset(email);
    return apiSuccess({ requested: true }, GENERIC_MESSAGE);
  } catch (error) {
    return handleRouteError(error);
  }
}

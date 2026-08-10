import type { NextRequest } from "next/server";
import { apiError, apiSuccess, handleRouteError, parseBody } from "@/lib/api";
import { getClientIp } from "@/server/auth";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { loginSchema } from "@/server/auth/auth.dto";
import {
  DEFAULT_ADMIN_LOGIN_EMAIL_RATE_LIMIT,
  DEFAULT_ADMIN_LOGIN_RATE_LIMIT,
  RATE_LIMIT_WINDOW_15_MIN_MS,
  RATE_LIMIT_WINDOW_1_HOUR_MS,
} from "@/constants";
import { peekRateLimit, rateLimitForEndpoint, tooManyRequests } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/server/security";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

const LOGIN_THROTTLED = "Too many login attempts. Try again later.";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request);
    const ipLimit = await rateLimitForEndpoint(
      "admin_login",
      ip,
      DEFAULT_ADMIN_LOGIN_RATE_LIMIT,
      RATE_LIMIT_WINDOW_15_MIN_MS
    );
    if (!ipLimit.allowed) {
      return tooManyRequests(ipLimit, LOGIN_THROTTLED);
    }

    const body = await request.json();
    const { email, password } = parseBody(loginSchema, body);

    // Peek (read-only) the per-email bucket so successful logins never count
    // toward it — only failed attempts increment it (below). This stops an
    // attacker's failures from locking out a legitimate user who logs in fine.
    const emailKey = email.toLowerCase();
    const emailPeek = await peekRateLimit(
      "admin_login_email",
      emailKey,
      DEFAULT_ADMIN_LOGIN_EMAIL_RATE_LIMIT,
      RATE_LIMIT_WINDOW_1_HOUR_MS
    );
    if (!emailPeek.allowed) {
      return tooManyRequests(emailPeek, LOGIN_THROTTLED);
    }

    const payload = await getPayloadClient();

    let result;
    try {
      result = await payload.login({
        collection: "users",
        data: { email, password },
      });
    } catch {
      // Count this failure against the per-email bucket.
      await rateLimitForEndpoint(
        "admin_login_email",
        emailKey,
        DEFAULT_ADMIN_LOGIN_EMAIL_RATE_LIMIT,
        RATE_LIMIT_WINDOW_1_HOUR_MS
      );
      // Audit the failure (generic; no signal on whether the account exists).
      await writeAuditLog(payload, {
        action: "auth.login_failed",
        actorEmail: emailKey,
        metadata: { ip },
      });
      return apiError("Invalid email or password.", 401);
    }

    // Credentials were valid, but only `active` accounts may sign in. A `pending`
    // invitee (not yet activated) or a `suspended` account is turned away and no
    // session cookie is issued.
    const status = (result.user as { status?: string }).status;
    if (status && status !== "active") {
      await writeAuditLog(payload, {
        action: "auth.login_rejected_status",
        actorEmail: emailKey,
        targetType: "users",
        targetId: String(result.user.id),
        metadata: { status, ip },
      });
      return apiError("Invalid email or password.", 401);
    }

    const response = apiSuccess({
      user: { id: result.user.id, email: result.user.email },
    });

    if (result.token) {
      const collection = payload.collections.users.config.auth;
      const prefix = payload.config.cookiePrefix;
      const maxAge = collection?.tokenExpiration ?? 604800;
      // In production, share the cookie across the apex + admin subdomain
      // by setting `domain` to the value of COOKIE_DOMAIN (e.g. `.kiribeonline.com`).
      // Local dev: COOKIE_DOMAIN is unset, so no domain attribute is applied
      // and the cookie stays scoped to the exact host (correct for localhost).
      const cookieDomain = process.env.COOKIE_DOMAIN?.trim() || undefined;
      response.cookies.set(`${prefix}-token`, result.token, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge,
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      });
    }

    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}

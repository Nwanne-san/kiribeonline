import { DEFAULT_ADMIN_WRITE_RATE_LIMIT, RATE_LIMIT_WINDOW_MS } from "@/constants";
import { rateLimitForEndpoint, RateLimitError } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/server/security";
import { requireAdminUserFromRequest, type AdminUser } from "./session";

/**
 * Authenticate an admin write request, then apply the shared `admin_write`
 * rate-limit bucket keyed on the session user id.
 *
 * Order matters: CSRF origin check first (cheap, header-only, no DB hit) →
 * session auth (401 if unauthenticated so callers can't consume another
 * user's budget) → rate limit. Use in every admin mutation handler
 * (POST/PATCH/DELETE); read handlers keep `requireAdminUserFromRequest`.
 */
export async function requireAdminWrite(request: Request): Promise<AdminUser> {
  assertSameOrigin(request);

  const user = await requireAdminUserFromRequest(request);

  const result = await rateLimitForEndpoint(
    "admin_write",
    String(user.id),
    DEFAULT_ADMIN_WRITE_RATE_LIMIT,
    RATE_LIMIT_WINDOW_MS
  );
  if (!result.allowed) {
    throw new RateLimitError(result.retryAfterSeconds);
  }

  return user;
}

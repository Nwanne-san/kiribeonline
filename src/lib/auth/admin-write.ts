import { DEFAULT_ADMIN_WRITE_RATE_LIMIT, RATE_LIMIT_WINDOW_MS } from "@/constants";
import { rateLimitForEndpoint, RateLimitError } from "@/lib/rate-limit";
import { requireAdminUserFromRequest, type AdminUser } from "./payload-session";

/**
 * Authenticate an admin write request, then apply the shared `admin_write`
 * rate-limit bucket keyed on the session user id.
 *
 * Server-side auth runs first (never behind the rate limiter), so unauthenticated
 * callers get 401 and cannot consume another user's budget. Use in every admin
 * mutation handler (POST/PATCH/DELETE); read handlers keep
 * `requireAdminUserFromRequest`.
 */
export async function requireAdminWrite(request: Request): Promise<AdminUser> {
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

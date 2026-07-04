import { apiError, handleRouteError } from "@/lib/api";
import { RateLimitError, tooManyRequests } from "@/lib/rate-limit";
import { AdminAuthError } from "./payload-session";

export function handleAdminAuthError(error: unknown) {
  if (error instanceof AdminAuthError) {
    return apiError(error.message, error.statusCode);
  }
  throw error;
}

/**
 * Single catch handler for admin route handlers: returns 401 for auth errors,
 * 429 (with `Retry-After`) for rate-limit errors, 400 for validation errors,
 * and 500 otherwise.
 */
export function handleAdminRouteError(error: unknown) {
  if (error instanceof AdminAuthError) {
    return handleAdminAuthError(error);
  }
  if (error instanceof RateLimitError) {
    return tooManyRequests(
      {
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + error.retryAfterSeconds * 1000,
        retryAfterSeconds: error.retryAfterSeconds,
      },
      error.message
    );
  }
  return handleRouteError(error);
}

import { apiError, handleRouteError } from "@/lib/api";
import { RateLimitError, tooManyRequests } from "@/lib/rate-limit";
import { CsrfError } from "@/server/security";
import { AdminAuthError } from "./session";

/**
 * Payload throws its own `ValidationError` (distinct from our internal one) with
 * per-field detail. Detect it by shape and surface the real message + field
 * errors so the admin toast shows *why* a save failed, not a generic 500.
 */
type PayloadFieldError = { path?: string; field?: string; label?: string; message: string };

function extractPayloadValidation(
  error: unknown
): { message: string; errors: Record<string, string[]> } | null {
  if (!error || typeof error !== "object") return null;
  const e = error as {
    name?: string;
    message?: string;
    data?: unknown;
    status?: number;
  };
  if (e.name !== "ValidationError") return null;

  // Payload's ValidationError.data is either an array of field errors or
  // `{ errors: [...] }` depending on version.
  const raw = e.data;
  const list: PayloadFieldError[] = Array.isArray(raw)
    ? (raw as PayloadFieldError[])
    : Array.isArray((raw as { errors?: unknown })?.errors)
      ? ((raw as { errors: PayloadFieldError[] }).errors)
      : [];

  const errors: Record<string, string[]> = {};
  for (const item of list) {
    const key = item.path || item.field || item.label || "form";
    (errors[key] ??= []).push(item.message);
  }

  return {
    message: e.message || "Some fields are invalid.",
    errors,
  };
}

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
  if (error instanceof CsrfError) {
    return apiError(error.message, error.statusCode);
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

  const payloadValidation = extractPayloadValidation(error);
  if (payloadValidation) {
    return apiError(payloadValidation.message, 400, payloadValidation.errors);
  }

  return handleRouteError(error);
}

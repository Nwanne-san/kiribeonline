import { apiError, handleRouteError } from "@/lib/api";
import { RateLimitError, tooManyRequests } from "@/lib/rate-limit";
import { CsrfError } from "@/server/security";
import { DomainError } from "@/server/errors";
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

  // Payload's ValidationError.data is either an array of field errors or
  // `{ errors: [...] }` depending on version.
  const raw = e.data;
  const list: PayloadFieldError[] = Array.isArray(raw)
    ? (raw as PayloadFieldError[])
    : Array.isArray((raw as { errors?: unknown })?.errors)
      ? ((raw as { errors: PayloadFieldError[] }).errors)
      : [];

  // Detect by shape, not by class name. Payload's ValidationError class name
  // gets minified in the production build (observed as `h:` in server logs)
  // so `e.name === "ValidationError"` false-negatives on prod and every
  // validation error became a generic 500. A well-formed field-error array
  // paired with the 400 status Payload assigns is the canonical signal.
  const looksLikeValidation =
    list.length > 0 && list.every((item) => typeof item?.message === "string");
  const isPayloadValidation =
    e.name === "ValidationError" || (looksLikeValidation && e.status === 400);
  if (!isPayloadValidation) return null;

  const errors: Record<string, string[]> = {};
  for (const item of list) {
    const key = item.path || item.field || item.label || "form";
    (errors[key] ??= []).push(item.message);
  }

  // Prefer the specific field message over Payload's generic
  // "The following field is invalid: <path>" summary. Editors need to see
  // *what* to fix, not just which field to look at.
  const primaryMessage =
    list.length === 1 ? list[0].message : e.message || "Some fields are invalid.";

  return { message: primaryMessage, errors };
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

  if (error instanceof DomainError) {
    return apiError(error.message, error.statusCode);
  }

  return handleRouteError(error);
}

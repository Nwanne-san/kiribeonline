/**
 * Sentry server-side (Node runtime) config.
 *
 * No-op when `SENTRY_DSN` is unset. Expected 4xx paths (CSRF, rate limit,
 * validation, admin auth) are filtered in `beforeSend` so they don't burn
 * quota — Sentry is for unexpected 5xx, not user-side rejections.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

/** Error class names that represent expected 4xx paths — not Sentry-worthy. */
const EXPECTED_ERROR_NAMES = new Set([
  "AdminAuthError",
  "CsrfError",
  "RateLimitError",
  "ValidationError",
  "ZodError",
]);

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    beforeSend(event, hint) {
      const err = hint?.originalException;
      if (err && typeof err === "object" && "name" in err) {
        if (EXPECTED_ERROR_NAMES.has(String((err as { name?: unknown }).name))) {
          return null;
        }
      }
      return event;
    },
  });
}

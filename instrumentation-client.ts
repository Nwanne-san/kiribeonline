/**
 * Sentry client-side (browser) config.
 *
 * No-op when `NEXT_PUBLIC_SENTRY_DSN` is unset — dev without a DSN stays
 * silent. Tracing sample rate is intentionally low (10%) since the free tier
 * caps quota fast; errors are always captured.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    // Drop noise: chunk-load failures on deploys (browser has an old bundle
    // and self-heals on next navigation), and network aborts on unmount.
    ignoreErrors: [
      "ChunkLoadError",
      "Loading chunk",
      "Non-Error promise rejection captured",
      "AbortError",
    ],
  });
}

/** Required by @sentry/nextjs so App Router navigations are instrumented. */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

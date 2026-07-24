/**
 * Next.js instrumentation entry — registers the server-side Sentry SDK when
 * the runtime boots (Node or Edge). The client SDK is initialized separately
 * via `sentry.client.config.ts`.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export { captureRequestError as onRequestError } from "@sentry/nextjs";

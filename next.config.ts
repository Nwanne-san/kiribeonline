import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";
import { withPayload } from "@payloadcms/next/withPayload";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * Allow the configured R2 public origin (custom domain or *.r2.dev) so
 * next/image can optimize media served from it. Without this, production
 * image requests from a custom media domain are rejected by the optimizer.
 */
function r2PublicPattern(): RemotePattern | null {
  const raw = process.env.R2_PUBLIC_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      pathname: "/**",
    };
  } catch {
    // Malformed R2_PUBLIC_URL — skip rather than break the build.
    return null;
  }
}

/**
 * Allow the app's own origin — Payload serves local-disk uploads from
 * `/api/media/file/...` on this host when R2 isn't configured (dev). Derived
 * from NEXT_PUBLIC_APP_URL so it works for any dev/staging origin.
 */
function appOriginPattern(): RemotePattern | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      pathname: "/**",
    };
  } catch {
    return null;
  }
}

// Only the app's own origin (dev local-disk media) is allowed by default. The
// exact R2 public host is added from `R2_PUBLIC_URL` below — we deliberately do
// NOT wildcard `*.r2.dev` / `*.r2.cloudflarestorage.com`, which would turn the
// next/image optimizer into an open resize proxy for any bucket on the internet.
const remotePatterns: RemotePattern[] = [
  { protocol: "http", hostname: "localhost", pathname: "/**" },
  { protocol: "http", hostname: "127.0.0.1", pathname: "/**" },
];

const r2Pattern = r2PublicPattern();
if (r2Pattern) remotePatterns.push(r2Pattern);

const appPattern = appOriginPattern();
if (
  appPattern &&
  !remotePatterns.some(
    (p) => p.hostname === appPattern.hostname && p.protocol === appPattern.protocol
  )
) {
  remotePatterns.push(appPattern);
}

const nextConfig: NextConfig = {
  // Reuse rendered route segments in the client Router Cache on navigation.
  // Admin layouts are `force-dynamic` (per-request auth), and Next 15 defaults
  // dynamic segments to a 0s router-cache lifetime — so every admin navigation
  // did a fresh server round-trip and re-rendered from scratch. A short reuse
  // window makes back/forward + tab switching feel cached without staleness
  // risk (API routes still enforce auth per request; RQ owns data freshness).
  // Trade-off: after a role change or suspension, an affected client can keep
  // its already-rendered admin chrome for up to 30s — mutations still 403.
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/admin/dashboard",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns,
    // Serve AVIF/WebP where the browser supports it; the optimizer negotiates
    // via the Accept header.
    formats: ["image/avif", "image/webp"],
    // Media is immutable once uploaded (hashed filenames), so cache optimized
    // variants at the edge for a day minimum.
    minimumCacheTTL: 86400,
  },
};

/**
 * Wrap with Sentry when a source-maps auth token is present. Without
 * `SENTRY_AUTH_TOKEN`, `withSentryConfig` still runs but skips the source-map
 * upload step, so local `next build` works fine even without a Sentry account.
 * The runtime SDKs stay no-ops when their DSNs aren't set.
 */
const sentryOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
};

export default withSentryConfig(withPayload(nextConfig), sentryOptions);

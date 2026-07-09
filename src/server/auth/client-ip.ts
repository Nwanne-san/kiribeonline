import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * Derive a rate-limit bucket key for the caller.
 *
 * Order of trust:
 * 1. `TRUSTED_IP_HEADER` — the platform-set header the client cannot forge
 *    (e.g. `cf-connecting-ip` behind Cloudflare, `x-vercel-forwarded-for` on
 *    Vercel). Configure per deployment; see `docs/DEPLOYMENT.md`.
 * 2. `x-forwarded-for` **last hop** — the value appended by the nearest proxy,
 *    harder to spoof than the client-controlled first hop.
 * 3. `x-real-ip`.
 * 4. When no IP is derivable, a short hash of request fingerprint headers, so
 *    unidentifiable callers do not all share one "unknown" bucket (which would
 *    let one client starve everyone else).
 */
/** One-time guard so the production warning below fires at most once per instance. */
let warnedMissingTrustedHeader = false;

export function getClientIp(request: NextRequest): string {
  const trustedHeader = process.env.TRUSTED_IP_HEADER;
  if (!trustedHeader && process.env.NODE_ENV === "production" && !warnedMissingTrustedHeader) {
    warnedMissingTrustedHeader = true;
    console.warn(
      "[client-ip] TRUSTED_IP_HEADER not set in production. Behind a CDN, " +
        "x-forwarded-for / x-real-ip resolve to the CDN edge, so rate limiting can " +
        "collapse to a per-edge bucket shared by many callers. Set TRUSTED_IP_HEADER " +
        "to the platform header the client cannot forge (cf-connecting-ip on Cloudflare, " +
        "x-vercel-forwarded-for on Vercel)."
    );
  }
  if (trustedHeader) {
    const value = request.headers.get(trustedHeader);
    const ip = value?.split(",")[0]?.trim();
    if (ip) return ip;
  }

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((hop) => hop.trim())
      .filter(Boolean);
    const lastHop = hops[hops.length - 1];
    if (lastHop) return lastHop;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return `anon:${fingerprint(request)}`;
}

/** Short, non-reversible hash of stable request headers. */
function fingerprint(request: NextRequest): string {
  const parts = [
    request.headers.get("user-agent") ?? "",
    request.headers.get("accept") ?? "",
    request.headers.get("accept-language") ?? "",
  ];
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 16);
}

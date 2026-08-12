import type { NextRequest } from "next/server";

/**
 * Small utilities that summarise an incoming request for a human — used by
 * the login-notification email and (later) other security receipts. Kept in
 * lib/http so both server actions and route handlers can share the format.
 *
 * All values are best-effort and safe to display verbatim:
 *   - the user-agent parser only names widely-known browsers/OSes and returns
 *     "Unknown" for anything else, so we never echo a raw UA into an email;
 *   - the geo helper reads the Vercel geo headers (auto-set on all requests
 *     served through Vercel) with graceful fallback to null when they're
 *     absent (local dev, self-hosted, or a request from a proxy that strips
 *     them). No external lookup, no extra latency, no rate limits.
 */

export type ParsedUserAgent = {
  browser: string;
  os: string;
};

const BROWSER_MATCHERS: Array<{ name: string; test: RegExp }> = [
  // Order matters: Edge and Opera embed "Chrome/..." in their UAs, so their
  // signatures must fire first or every non-Chrome browser reads as Chrome.
  { name: "Edge", test: /\bEdg\/[\d.]+/ },
  { name: "Opera", test: /\b(OPR|Opera)\/[\d.]+/ },
  { name: "Firefox", test: /\bFirefox\/[\d.]+/ },
  { name: "Samsung Internet", test: /\bSamsungBrowser\/[\d.]+/ },
  { name: "Chrome", test: /\bChrome\/[\d.]+/ },
  { name: "Safari", test: /\bVersion\/[\d.]+.*\bSafari\/[\d.]+/ },
];

const OS_MATCHERS: Array<{ name: string; test: RegExp }> = [
  { name: "iOS", test: /\biPhone\b|\biPad\b|\biPod\b|\biOS\b/ },
  { name: "Android", test: /\bAndroid\b/ },
  { name: "macOS", test: /\bMac OS X\b|\bMacintosh\b/ },
  { name: "Windows", test: /\bWindows NT\b/ },
  { name: "Linux", test: /\bLinux\b/ },
];

/**
 * Parse a User-Agent into a browser + OS label. Never returns the raw UA — a
 * miss reads as "Unknown" so email recipients don't see a wall of tokens.
 */
export function parseUserAgent(rawUa: string | null | undefined): ParsedUserAgent {
  const ua = rawUa ?? "";
  const browser = BROWSER_MATCHERS.find((m) => m.test.test(ua))?.name ?? "Unknown browser";
  const os = OS_MATCHERS.find((m) => m.test.test(ua))?.name ?? "Unknown OS";
  return { browser, os };
}

export type ApproxLocation = {
  /** Two-letter ISO country code, when the platform surfaces it. */
  country: string | null;
  /** Human-readable city, URL-decoded. */
  city: string | null;
  /** Region/state code, when present (US-CA, GB-ENG, etc). */
  region: string | null;
};

function decodeHeader(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    // Vercel URI-encodes city + region so multi-byte names survive HTTP; the
    // country header is plain ASCII but decode is a no-op there.
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

/**
 * Read approximate location from platform geo headers. Vercel sets these on
 * every edge/serverless request (see docs/DEPLOYMENT.md). Returns nulls in
 * local dev / self-hosted / when the platform can't resolve — callers are
 * expected to hide missing fields rather than showing "null" strings.
 */
export function getApproxLocation(request: NextRequest): ApproxLocation {
  return {
    country: decodeHeader(request.headers.get("x-vercel-ip-country")),
    city: decodeHeader(request.headers.get("x-vercel-ip-city")),
    region: decodeHeader(request.headers.get("x-vercel-ip-country-region")),
  };
}

/**
 * Human-readable one-line summary for use in email info rows. Returns null
 * when no geo signal is available at all so the caller can skip the row.
 */
export function formatLocationSummary(loc: ApproxLocation): string | null {
  const parts = [loc.city, loc.region, loc.country].filter(
    (p): p is string => Boolean(p)
  );
  return parts.length > 0 ? parts.join(", ") : null;
}

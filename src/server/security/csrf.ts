/**
 * Origin/Referer CSRF defense for state-changing endpoints.
 *
 * Combined with our SameSite=lax httpOnly session cookie, an Origin allowlist
 * closes the CSRF door: browsers won't send the session on cross-site top-level
 * POSTs, and the server rejects anything whose `Origin` (or `Referer` when
 * absent) doesn't match a trusted origin. See docs/AUTH-HARDENING.md.
 *
 * The allowlist comes from `buildAllowedOrigins()` (shared with Payload's own
 * cookie extractor), so one env change updates both defenses.
 *
 * Usage: call `assertSameOrigin(request)` at the top of every mutation handler
 * (admin writes go through `requireAdminWrite`, which wraps this). Read-only
 * handlers do not need to call it — GET/HEAD/OPTIONS are exempt.
 */

import { buildAllowedOrigins } from "@/lib/security/allowed-origins";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export class CsrfError extends Error {
  statusCode = 403;
  constructor(message = "Cross-origin request rejected") {
    super(message);
    this.name = "CsrfError";
  }
}

/**
 * Cached after first read. Reload the module (server restart) after changing
 * envs — matches how our rate-limit constants behave.
 */
let cachedAllowlist: Set<string> | null = null;

function normalizeOrigin(raw: string): string | null {
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

function getAllowlist(): Set<string> {
  if (!cachedAllowlist) cachedAllowlist = new Set(buildAllowedOrigins());
  return cachedAllowlist;
}

/**
 * Test-only: clear the cached allowlist so a test can mutate env vars between
 * cases. Not exported from any barrel.
 */
export function _resetCsrfAllowlistForTests(): void {
  cachedAllowlist = null;
}

/**
 * Reject the request when its origin is not on the CSRF allowlist. Prefers
 * `Origin` (set by browsers on all cross-origin requests + most same-origin
 * fetches); falls back to `Referer` when `Origin` is absent (e.g. some proxies
 * and privacy-hardened clients).
 *
 * If BOTH headers are missing, we allow the request. Per OWASP CSRF cheat
 * sheet, that's an accept-or-reject choice and accept is defensible when a
 * SameSite=lax session cookie is already in place — a real cross-site CSRF
 * (a) can't send our cookie thanks to SameSite, and (b) if it's a browser POST
 * to a state-changing endpoint, the browser attaches `Origin` per the Fetch
 * spec, so it'd be caught by the mismatch branch anyway. Reject-on-missing
 * broke legitimate callers (Playwright APIRequestContext, some server-to-
 * server tools) without adding real defense.
 *
 * The empty allowlist (no envs set) still rejects any present-but-known
 * origin — fail-closed. In dev, `NEXT_PUBLIC_APP_URL=http://localhost:3000`
 * (already in `.env.example`) fills the allowlist.
 */
export function assertSameOrigin(request: Request): void {
  const method = request.method.toUpperCase();
  if (SAFE_METHODS.has(method)) return;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const candidate = origin ?? (referer ? normalizeOrigin(referer) : null);

  // Neither header set — accept and rely on SameSite=lax cookie for CSRF
  // defense. Browsers set `Origin` on cross-site POST/PATCH/DELETE per Fetch
  // spec, so a real CSRF attack cannot land here without triggering the
  // mismatch branch below.
  if (!candidate) return;

  const allowlist = getAllowlist();
  if (allowlist.has(candidate)) return;

  // Same-host validation: if candidate matches the incoming request's host/proto
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host) {
    const reqOrigin = normalizeOrigin(`${proto}://${host}`);
    if (reqOrigin && candidate === reqOrigin) return;
  }

  throw new CsrfError();
}

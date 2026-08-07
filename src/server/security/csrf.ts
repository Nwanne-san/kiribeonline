/**
 * Origin/Referer CSRF defense for state-changing endpoints.
 *
 * Combined with our SameSite=lax httpOnly session cookie, an Origin allowlist
 * closes the CSRF door: browsers won't send the session on cross-site top-level
 * POSTs, and the server rejects anything whose `Origin` (or `Referer` when
 * absent) doesn't match a trusted origin. See docs/AUTH-HARDENING.md.
 *
 * Usage: call `assertSameOrigin(request)` at the top of every mutation handler
 * (admin writes go through `requireAdminWrite`, which wraps this). Read-only
 * handlers do not need to call it — GET/HEAD/OPTIONS are exempt.
 */

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export class CsrfError extends Error {
  statusCode = 403;
  constructor(message = "Cross-origin request rejected") {
    super(message);
    this.name = "CsrfError";
  }
}

/**
 * Env-configured allowlist, cached after first read. Reload the module (server
 * restart) after changing envs — matches how our rate-limit constants behave.
 */
let cachedAllowlist: Set<string> | null = null;

function normalizeOrigin(raw: string): string | null {
  try {
    const url = new URL(raw);
    // Origin is scheme + host + port, no path/hash/query. `URL#origin` handles
    // default-port stripping (`:80`/`:443`) so we don't need to.
    return url.origin;
  } catch {
    return null;
  }
}

function buildAllowlist(): Set<string> {
  const explicit = (process.env.CSRF_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const fallback = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_API_URL,
  ].filter((value): value is string => Boolean(value));
  const raw = [...explicit, ...fallback];
  const set = new Set<string>();

  for (const item of raw) {
    const norm = normalizeOrigin(item);
    if (!norm) continue;
    set.add(norm);
    try {
      const url = new URL(norm);
      if (url.hostname.startsWith("www.")) {
        const apex = `${url.protocol}//${url.hostname.slice(4)}${url.port ? `:${url.port}` : ""}`;
        set.add(apex);
      } else if (!url.hostname.includes("localhost") && !url.hostname.includes("127.0.0.1")) {
        const www = `${url.protocol}//www.${url.hostname}${url.port ? `:${url.port}` : ""}`;
        set.add(www);
      }
    } catch {
      // ignore
    }
  }

  return set;
}

function getAllowlist(): Set<string> {
  if (!cachedAllowlist) {
    cachedAllowlist = buildAllowlist();
  }
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

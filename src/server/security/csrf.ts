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
  const normalized = raw
    .map(normalizeOrigin)
    .filter((origin): origin is string => Boolean(origin));
  return new Set(normalized);
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
 * fetches); falls back to `Referer` when `Origin` is absent (e.g. server-to-
 * server tools, some proxies). Missing both on a state-changing request is
 * itself suspicious and gets rejected.
 *
 * The empty allowlist (no envs set) is treated as "no known origins" and
 * rejects everything — this is fail-closed by design, matching our
 * env-parsing posture. In dev, `NEXT_PUBLIC_APP_URL=http://localhost:3000`
 * (already in `.env.example`) fills the allowlist.
 */
export function assertSameOrigin(request: Request): void {
  const method = request.method.toUpperCase();
  if (SAFE_METHODS.has(method)) return;

  const allowlist = getAllowlist();
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const candidate = origin ?? (referer ? normalizeOrigin(referer) : null);

  if (!candidate) throw new CsrfError("Missing Origin/Referer");
  if (!allowlist.has(candidate)) throw new CsrfError();
}

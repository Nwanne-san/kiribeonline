/**
 * Single source of truth for the set of origins the app trusts for
 * state-changing cross-origin requests.
 *
 * Two consumers today:
 *
 * 1. Our custom CSRF check (`src/server/security/csrf.ts`) uses this to
 *    accept/reject the `Origin` (or `Referer`) header on mutations.
 * 2. Payload's own cookie extractor (`payload.config.csrf`) uses the same
 *    list to decide whether to trust a session cookie on an incoming
 *    request. Without the admin subdomain in this list, Payload silently
 *    drops the token and every admin write 401s.
 *
 * Keeping them in one function ensures adding a new domain (staging,
 * partner subdomain, preview alias) only takes one edit.
 *
 * The builder is pure and env-driven, so tests can call it directly with a
 * mocked environment. `normalizeOrigin` runs each entry through `new URL()`
 * so a stray path/hash/query never leaks into the allowlist and default
 * ports (`:80`/`:443`) are stripped.
 */

function normalizeOrigin(raw: string): string | null {
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export type AllowedOriginsOptions = {
  /** Include Vercel-injected origins (VERCEL_URL etc). Default true. */
  includeVercel?: boolean;
  /** Include localhost + admin.localhost for dev. Default true off prod. */
  includeLocalhost?: boolean;
};

/**
 * Build the full set of trusted origins from environment variables.
 *
 * Sources (all optional; missing entries are dropped):
 * - `NEXT_PUBLIC_APP_URL`, `APP_URL` — canonical public origins
 * - `PRIMARY_HOST` — apex host; both bare and `www.` variants added
 * - `ADMIN_HOST` — admin subdomain host
 * - `CSRF_ALLOWED_ORIGINS` — comma-separated explicit list (highest fidelity)
 * - `VERCEL_URL`, `VERCEL_BRANCH_URL`, `VERCEL_PROJECT_PRODUCTION_URL`
 *   — Vercel's build-time deploy identifiers, so previews auto-work
 * - Local dev: `http://localhost:3000` + `http://admin.localhost:3000`
 *
 * De-duplication via `Set`. Result is a plain string array suitable for
 * Payload's `csrf` config field.
 */
export function buildAllowedOrigins(options: AllowedOriginsOptions = {}): string[] {
  const { includeVercel = true, includeLocalhost = process.env.NODE_ENV !== "production" } =
    options;
  const origins = new Set<string>();
  const push = (value?: string) => {
    if (!value) return;
    const normalized = normalizeOrigin(value);
    if (normalized) origins.add(normalized);
  };

  push(process.env.NEXT_PUBLIC_APP_URL);
  push(process.env.APP_URL);
  push(process.env.NEXT_PUBLIC_API_URL);

  const primary = process.env.PRIMARY_HOST;
  if (primary) {
    push(`https://${primary}`);
    push(`https://www.${primary}`);
  }
  const admin = process.env.ADMIN_HOST;
  if (admin) push(`https://${admin}`);

  // Explicit override wins — an operator can add a staging preview or a
  // partner origin here without editing config.
  (process.env.CSRF_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach(push);

  if (includeVercel) {
    if (process.env.VERCEL_URL) push(`https://${process.env.VERCEL_URL}`);
    if (process.env.VERCEL_BRANCH_URL) push(`https://${process.env.VERCEL_BRANCH_URL}`);
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
      push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }

  if (includeLocalhost) {
    push("http://localhost:3000");
    push("http://admin.localhost:3000");
  }

  return Array.from(origins);
}

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Host-based routing.
 *
 * Kiribé serves two products from one codebase:
 *   - the public editorial site on `kiribeonline.com` (and `www.`)
 *   - the custom admin on `admin.kiribeonline.com`
 *
 * The admin subdomain rewrites `/*` → `/admin/*` internally so the admin
 * routes under `src/app/admin/**` can stay right where they are — no
 * separate deployment target, no duplicate build. The apex redirects
 * `/admin/*` to `admin.kiribeonline.com/` (stripping the `/admin` prefix)
 * so bookmarks and old links keep working.
 *
 * Preview deployments on `*.vercel.app` are untouched: they share one URL
 * per branch, so any subdomain switching would break the preview flow.
 * Local dev keeps `/admin/*` reachable on `localhost:3000` and also
 * accepts `admin.localhost:3000` for parity testing.
 */

/** Public (apex) host. Editorial site lives here. */
const PRIMARY_HOST = process.env.PRIMARY_HOST ?? "kiribeonline.com";
/** Admin subdomain host. Custom admin lives here. */
const ADMIN_HOST = process.env.ADMIN_HOST ?? "admin.kiribeonline.com";

/**
 * Auth-related admin paths that must remain reachable from the admin host —
 * these live under `/admin/**` in the app router. Everything else on the
 * admin host gets rewritten to `/admin<pathname>` so the admin UI can also
 * live at `admin.kiribeonline.com/` (root) → `/admin`.
 */
const ADMIN_SEGMENT = "/admin";

/**
 * Assets and framework routes we never touch — bypass immediately so the
 * middleware doesn't reshape asset URLs and break caching.
 */
const BYPASS_PATTERN = /^\/(_next|api\/health|favicon\.ico|robots\.txt|sitemap\.xml|manifest\.webmanifest|.*\.(png|jpg|jpeg|webp|svg|ico|gif|css|js|map|txt|xml))/;

/**
 * True when the host looks like a Vercel preview deployment (either the
 * platform default `*.vercel.app` or a preview alias). We leave those
 * requests alone — one URL serves both public and admin.
 */
function isPreviewHost(host: string): boolean {
  return host.endsWith(".vercel.app");
}

/**
 * Compare hosts case-insensitively and ignore the port. `www.host === host`
 * is handled downstream at the redirect layer.
 */
function hostMatches(actual: string, expected: string): boolean {
  const a = actual.toLowerCase().split(":")[0];
  const e = expected.toLowerCase().split(":")[0];
  return a === e;
}

function isAdminHost(host: string): boolean {
  if (hostMatches(host, ADMIN_HOST)) return true;
  // Local dev parity: admin.localhost or admin.127.0.0.1 (any port) also
  // rewrite to `/admin` so `curl http://admin.localhost:3000/dashboard`
  // hits the admin UI the same way as production.
  const bare = host.toLowerCase().split(":")[0];
  return bare.startsWith("admin.localhost") || bare === "admin.127.0.0.1";
}

function isPrimaryHost(host: string): boolean {
  const bare = host.toLowerCase().split(":")[0];
  if (bare === PRIMARY_HOST.toLowerCase()) return true;
  if (bare === `www.${PRIMARY_HOST.toLowerCase()}`) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname, search } = request.nextUrl;

  // 1. Never touch framework internals or static assets.
  if (BYPASS_PATTERN.test(pathname)) return NextResponse.next();

  // 2. Preview deploys share a single URL — leave everything alone.
  if (isPreviewHost(host)) return NextResponse.next();

  // 3. Admin subdomain → rewrite to /admin/*.
  //    - `admin.kiribeonline.com/dashboard` → internally serves `/admin/dashboard`.
  //    - `admin.kiribeonline.com/admin/dashboard` (existing internal
  //      `router.push("/admin/...")` code) passes through untouched so we
  //      don't burn a 308 on every admin navigation.
  //    - `admin.kiribeonline.com/` → serves `/admin` (login → dashboard).
  //    Both URL shapes render the same page. Admin routes are `noindex`
  //    (per each page's metadata) so duplicate URLs don't cost anything on
  //    the SEO side; the clean URL is what we surface to humans in bookmarks
  //    and the copy-invite-link flow.
  if (isAdminHost(host)) {
    if (pathname === "/" || pathname === "") {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_SEGMENT;
      return NextResponse.rewrite(url);
    }
    if (pathname.startsWith(`${ADMIN_SEGMENT}/`) || pathname === ADMIN_SEGMENT) {
      // Internal navigation already targets `/admin/*` — pass through so
      // `router.push` doesn't kick off a 308 that reloads the whole page.
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = `${ADMIN_SEGMENT}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // 4. Apex → redirect any /admin path to the admin subdomain root, dropping
  //    the `/admin` prefix. `kiribeonline.com/admin/dashboard` becomes
  //    `admin.kiribeonline.com/dashboard`; `.../admin` becomes the admin
  //    root. Uses 308 so browsers cache the redirect and preserve the
  //    HTTP method + body (matters for the login POST if a user bookmarked
  //    a form submission).
  if (isPrimaryHost(host)) {
    if (pathname === ADMIN_SEGMENT || pathname.startsWith(`${ADMIN_SEGMENT}/`)) {
      const stripped = pathname.slice(ADMIN_SEGMENT.length) || "/";
      const redirectUrl = new URL(`${stripped}${search}`, `https://${ADMIN_HOST}`);
      return NextResponse.redirect(redirectUrl, 308);
    }
    // `www.kiribeonline.com` → `kiribeonline.com` canonicalisation. Keeps
    // one canonical apex origin for SEO. Only applies when the primary host
    // is a bare apex (localhost is safe because it never matches `www.`).
    const bare = host.toLowerCase().split(":")[0];
    if (bare === `www.${PRIMARY_HOST.toLowerCase()}`) {
      const redirectUrl = new URL(`${pathname}${search}`, `https://${PRIMARY_HOST}`);
      return NextResponse.redirect(redirectUrl, 308);
    }
    return NextResponse.next();
  }

  // 5. Anything else (localhost:3000 without the `admin.` prefix, IP access,
  //    unknown custom domain) passes through untouched. `/admin/**` remains
  //    reachable in local dev without needing the subdomain.
  return NextResponse.next();
}

export const config = {
  /**
   * Match everything, then bypass framework internals in the handler. The
   * negative-lookahead style matcher is fragile in the presence of runtime
   * env-based host logic — a single matcher with in-handler bypass is
   * simpler to reason about and only marginally more expensive per request.
   */
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};

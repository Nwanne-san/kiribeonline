/** Non-secret app-wide defaults — import from `@/constants`. */

export const DEFAULT_PAGE_LIMIT = 24;
export const MAX_PAGE_LIMIT = 50;
export const PAGE_LIMIT_OPTIONS = [12, 24, 48] as const;

/** Admin list views — tighter default with a page-size selector (Figma). */
export const ADMIN_DEFAULT_PAGE_LIMIT = 20;
export const ADMIN_PAGE_LIMIT_OPTIONS = [10, 20, 50] as const;

export const MIN_SEARCH_LENGTH = 2;
export const DEFAULT_DEBOUNCE_MS = 300;

/**
 * Article-editor autosave interval. Long enough that a typing editor doesn't
 * fire a request on every pause; short enough that a browser crash costs at
 * most half a minute. Only applies to drafts and in_review — never to
 * published/scheduled/archived, where writes should be intentional.
 */
export const ARTICLE_AUTOSAVE_DEBOUNCE_MS = 30_000;

export const URL_PARAMS = {
  page: "page",
  limit: "limit",
  q: "q",
  view: "view",
  filter: "filter",
  modal: "modal",
} as const;

/**
 * Hard cap on category/section links in the public header. The Figma nav is a
 * single centred row between the wordmark and the search + Subscribe cluster;
 * past six labels it wraps and collides with the utility rail on laptop widths.
 * Enforced in three places so it can't be exceeded from any direction: the
 * Payload array (`maxRows`), the admin PATCH schema, and the header resolver.
 * Overflow categories stay reachable via `/categories` and the mobile drawer.
 */
export const NAV_MAX_HEADER_LINKS = 6;

/**
 * Category chips offered in the header search panel's "Browse by category"
 * shortcut. Capped so the panel stays one or two tidy rows on mobile instead of
 * pushing the results list below the fold.
 */
export const SEARCH_CATEGORY_SUGGESTION_LIMIT = 6;

/**
 * Public article view modes. `feed` (infinite scroll) was retired — any stale
 * `?view=feed` link falls back to `DEFAULT_LIST_VIEW` via `useListViewMode`.
 */
export const LIST_VIEW_MODES = ["grid", "list"] as const;
export type ListViewMode = (typeof LIST_VIEW_MODES)[number];
export const DEFAULT_LIST_VIEW: ListViewMode = "grid";

export const LIST_STALE_TIME_MS = 5 * 60 * 1000;
export const SEARCH_STALE_TIME_MS = 0;
export const QUERY_RETRY_COUNT = 2;

export const DEFAULT_ARTICLES_RATE_LIMIT = 60;
export const DEFAULT_SEARCH_RATE_LIMIT = 30;
export const DEFAULT_ANALYTICS_VIEW_RATE_LIMIT = 120;
export const DEFAULT_HEALTH_RATE_LIMIT = 30;

/** Public write endpoints. */
export const DEFAULT_CONTACT_RATE_LIMIT = 5;
export const DEFAULT_SUBSCRIBE_RATE_LIMIT = 3;
export const DEFAULT_SUBSCRIBE_CONFIRM_RATE_LIMIT = 10;

/** Credential endpoint — two dimensions: per IP and per email. */
export const DEFAULT_ADMIN_LOGIN_RATE_LIMIT = 5;
export const DEFAULT_ADMIN_LOGIN_EMAIL_RATE_LIMIT = 10;

/**
 * Sensitive credential mutations (accept-invite, forgot-password) — tight
 * tier, matching BrandDrive's sensitive-route posture (~5/min). See
 * AUTH-HARDENING §3.
 */
export const DEFAULT_ADMIN_SENSITIVE_RATE_LIMIT = 5;

/**
 * The reset-password submit tier is looser than the send-email tier — the
 * request body must include a 32-byte reset token (~10^76 keyspace) so per-IP
 * volume is not the primary defense, and a real user retrying a stale link
 * (browser prefill, back-button) can chew through five attempts fast. A shared
 * office/VPN IP would otherwise lock the whole team out of their own resets.
 */
export const DEFAULT_ADMIN_RESET_SUBMIT_RATE_LIMIT = 20;

/** Shared bucket for all admin write routes, keyed on the session user id. */
export const DEFAULT_ADMIN_WRITE_RATE_LIMIT = 60;

/** Rate-limit windows. */
export const RATE_LIMIT_WINDOW_MS = 60 * 1000;
export const RATE_LIMIT_WINDOW_15_MIN_MS = 15 * 60 * 1000;
export const RATE_LIMIT_WINDOW_1_HOUR_MS = 60 * 60 * 1000;

/**
 * Admin session token lifetime (seconds). Short by default (2h) per
 * AUTH-HARDENING §2 — override with `ADMIN_TOKEN_TTL_SECONDS`. Payload issues a
 * fresh token on each authenticated request, so active sessions roll forward.
 */
export const DEFAULT_ADMIN_TOKEN_TTL_SECONDS = 60 * 60 * 2;

export const DEFAULT_LIST_REVALIDATE_SECONDS = 60;

/** Max size for a single admin media upload. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Max decoded pixel count sharp will accept (40MP ≈ 160MB RGBA). Caps decode
 * memory on untrusted images independently of the byte-size limit — a crafted
 * file can be small on disk but enormous decoded.
 */
export const MAX_IMAGE_PIXELS = 40_000_000;

export const ARTICLE_LIST_SORT = "-publishedAt";

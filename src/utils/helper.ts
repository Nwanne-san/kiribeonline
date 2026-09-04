import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function formatDate(date: string | Date, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

/** `29-10-2026` — the numeric form used once a story is no longer "recent". */
export function formatShortDate(date: string | Date): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

/**
 * English ordinal suffix — 1st, 2nd, 3rd, 4th, 21st, 22nd, 23rd, …
 *
 * The 11–13 special-case is why this is a helper and not `n + "th"`.
 */
function ordinalSuffix(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

/**
 * `18th August 2026` — the ordinal editorial form used on the article detail
 * page byline once a story is no longer "recent". Renders the calendar month
 * in full to match the print-editorial voice; use `formatShortDate` for
 * space-constrained surfaces (cards, list metadata).
 */
export function formatOrdinalDate(date: string | Date): string {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "long" });
  return `${day}${ordinalSuffix(day)} ${month} ${d.getFullYear()}`;
}

/**
 * Format a UTC instant as the local-wall-clock string an `<input
 * type="datetime-local">` expects (`YYYY-MM-DDTHH:mm`).
 *
 * The bug this exists to prevent: `iso.slice(0, 16)` strips the `Z` and hands
 * UTC digits to the input, which then renders them as the *editor's* local
 * time. Re-saving that value drifts the timestamp by the editor's UTC offset
 * every round-trip.
 */
export function toLocalDatetimeInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Parse a `<input type="datetime-local">` value (`YYYY-MM-DDTHH:mm`, no
 * timezone) as the editor's local wall-clock time and return a UTC ISO string.
 */
export function fromLocalDatetimeInputValue(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Cutoff past which a byline shows the calendar date instead of "N days ago". */
const RELATIVE_DATE_WINDOW_DAYS = 7;

/**
 * Byline date, phrased the way a reader scans it: "16 hours ago" / "yesterday" /
 * "2 days ago" for fresh stories, and the plain `DD-MM-YYYY` date once the piece
 * is older than a week.
 *
 * `now` is injectable so callers (and tests) can pin the reference point.
 *
 * Because this is time-relative, server and client can render different strings
 * across a boundary tick. Callers render it inside an element marked
 * `suppressHydrationWarning` — the value self-corrects on the next render and
 * the machine-readable timestamp lives in the `<time dateTime>` attribute.
 */
export function formatBylineDate(
  date: string | Date,
  now: Date = new Date(),
  fallback: (d: Date) => string = formatShortDate
): string {
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();

  // Future or clock-skewed dates fall back to the calendar date rather than
  // rendering a nonsensical "-3 hours ago".
  if (diffMs < 0) return fallback(then);

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < RELATIVE_DATE_WINDOW_DAYS) return `${days} days ago`;

  return fallback(then);
}

/**
 * Article-detail byline: relative for fresh stories, ordinal editorial date
 * (e.g. `18th August 2026`) once older than a week. Cards keep the numeric
 * `DD-MM-YYYY` form for space reasons — see [[formatBylineDate]].
 */
export function formatDetailByline(date: string | Date, now: Date = new Date()): string {
  return formatBylineDate(date, now, formatOrdinalDate);
}

export function getRelativeTime(dateString: string | Date) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((Number(now) - Number(date)) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(date);
}

/** Walk a Lexical body collecting text to estimate reading time (~200 wpm). */
export function estimateReadingTime(body: unknown): number {
  let words = 0;
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const n = node as { text?: unknown; children?: unknown };
    if (typeof n.text === "string") {
      words += n.text.trim().split(/\s+/).filter(Boolean).length;
    }
    if (Array.isArray(n.children)) n.children.forEach(walk);
  };
  const root = (body as { root?: unknown })?.root;
  walk(root);
  return Math.max(1, Math.round(words / 200));
}

/** Resolve a populated author relation to a display name, if available. */
export function resolveAuthorName(
  author?: { name?: string | null } | string | null
): string | undefined {
  if (author && typeof author === "object" && author.name) return author.name;
  return undefined;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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
  now: Date = new Date()
): string {
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();

  // Future or clock-skewed dates fall back to the calendar date rather than
  // rendering a nonsensical "-3 hours ago".
  if (diffMs < 0) return formatShortDate(then);

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < RELATIVE_DATE_WINDOW_DAYS) return `${days} days ago`;

  return formatShortDate(then);
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

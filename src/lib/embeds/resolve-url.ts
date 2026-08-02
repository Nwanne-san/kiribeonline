/**
 * Short-link resolution for editor-pasted URLs. Some social platforms hand
 * their mobile "Copy link" flows a short redirect (e.g. `vm.tiktok.com/xxxxx`,
 * `www.tiktok.com/t/xxxxx`) that carries no video id in the path — the id only
 * appears after the HTTP redirect. `parseEmbed` runs at render time and can't
 * make network calls, so those pastes would silently degrade to the "Watch on
 * original site" fallback for every reader.
 *
 * This module runs at content-save time: the Reels `beforeChange` hook detects
 * a short link, follows the redirect once, and stores the canonical URL. All
 * downstream reads then embed normally with no per-request overhead.
 *
 * Resolution is best-effort — a network failure returns the original URL
 * unchanged so a bad DNS moment can't block an editor from saving.
 */

const RESOLVER_TIMEOUT_MS = 4000;

/**
 * True when a URL is known to be a short redirect that needs to be followed
 * before `parseEmbed` can extract a video id.
 */
export function needsResolution(input: string): boolean {
  const url = safeParse(input);
  if (!url) return false;
  if (url.hostname === "vm.tiktok.com") return true;
  // TikTok web "Share → Copy link" hands out `/t/{code}/` under the canonical
  // host, which also carries no id in the path.
  if (
    (url.hostname === "www.tiktok.com" || url.hostname === "tiktok.com") &&
    /^\/t\//.test(url.pathname)
  ) {
    return true;
  }
  return false;
}

/**
 * Follow the redirect chain (with a short timeout) and return the final URL.
 * Returns the original input on any failure so a network hiccup can't block
 * a save.
 */
export async function resolveShortUrl(
  input: string,
  timeoutMs = RESOLVER_TIMEOUT_MS
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // `HEAD` first — much cheaper than pulling the video page HTML. Falls back
    // to `GET` if the endpoint doesn't support HEAD (some CDNs 405 on it).
    let res = await fetch(input, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(input, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT },
      });
    }
    return res.url && res.url !== input ? res.url : input;
  } catch {
    return input;
  } finally {
    clearTimeout(timer);
  }
}

const USER_AGENT =
  "Mozilla/5.0 (compatible; KiribeBot/1.0; +https://kiribe.online)";

function safeParse(input: string): URL | null {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

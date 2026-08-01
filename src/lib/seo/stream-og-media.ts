/**
 * Serve an already-hosted image through an `opengraph-image` route.
 *
 * The obvious implementation of these routes is `Response.redirect(mediaUrl)`,
 * but several major scrapers (X, LinkedIn, WhatsApp, Slack) do not follow
 * redirects when fetching `og:image` and silently drop the preview. Proxying
 * the bytes from our own origin makes the card render everywhere.
 *
 * Returns `null` on any problem — unreachable host, non-2xx, or a response that
 * isn't actually an image — so callers can fall back to a branded card instead
 * of serving a broken image to a crawler.
 */

/** Give up rather than hold a scraper's connection open indefinitely. */
const FETCH_TIMEOUT_MS = 4000;

export async function streamMedia(url: string): Promise<Response | null> {
  try {
    const upstream = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      // Media is content-addressed by filename; let the platform cache hold it.
      cache: "force-cache",
    });

    if (!upstream.ok || !upstream.body) return null;

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;

    return new Response(upstream.body, {
      headers: {
        "Content-Type": contentType,
        // Uploads get a new filename on replace, so the URL is safe to pin.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[opengraph-image] media proxy failed, using branded card", err);
    return null;
  }
}

/**
 * Parse a social/media URL into a sanitized, embeddable descriptor for article
 * bodies. This is the single sanitization seam for editorial embeds: a strict
 * host allow-list plus `safeUrl` decide whether a URL becomes a live iframe.
 *
 * Recognised iframe platforms: YouTube (incl. Shorts), Vimeo, Instagram,
 * TikTok, Spotify (episode/track/show/playlist/album). Any other *valid http(s)*
 * URL degrades to a typed `link-card` — a plain link-out that NEVER renders an
 * iframe. Non-URL / non-http(s) input returns `null`.
 *
 * The Reels feature consumes a restricted view of this parser via
 * `parseReelEmbed` (re-exported from `src/lib/reels/parse-embed.ts`).
 *
 * X / Twitter is intentionally omitted: their embeds require the
 * `platform.twitter.com` widget script to run on load, which conflicts with our
 * no-third-party-request-until-click contract. Revisit if/when an oEmbed image
 * fallback is acceptable; for now an X URL degrades to a safe `link-card`.
 */

/** Platforms we render as a click-to-load iframe. */
export type EmbedPlatform =
  | "youtube"
  | "vimeo"
  | "instagram"
  | "tiktok"
  | "spotify";

/** All embed node kinds, including the non-iframe fallback. */
export type ArticleEmbedKind = EmbedPlatform | "link-card";

/** How the public renderer should frame an embed. */
export type EmbedLayout = "video" | "audio" | "card";

export type ArticleEmbed = {
  platform: ArticleEmbedKind;
  /** iframe `src` for allow-listed platforms; `null` for `link-card`. */
  embedUrl: string | null;
  /** The original URL — the link-out target and the value we re-validate. */
  externalUrl: string;
  /** Drives framing on the public side. `card` never mounts an iframe. */
  layout: EmbedLayout;
  /** CSS aspect-ratio for `video` layout (responsive box). */
  aspectRatio?: string;
  /** Fixed iframe height in px for `audio` layout (Spotify). */
  frameHeight?: number;
  /** For `link-card`: the hostname shown as the card title. */
  title?: string;
};

// ── Reels-compatible types (restricted view; re-exported by the reels shim) ──

export type ReelPlatform = "instagram" | "tiktok" | "youtube";

export type ReelEmbed = {
  platform: ReelPlatform;
  embedUrl: string;
  /** Width is informational only; the card renders responsively. */
  aspectRatio: "9 / 16" | "16 / 9";
  /** The original URL — used as the fallback link if the iframe is blocked. */
  externalUrl: string;
  /** True when the embed renders comfortably in a 200×356 card. */
  fitsPortraitCard: boolean;
};

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);
const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"]);
const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com"]);
const TIKTOK_HOSTS = new Set([
  "tiktok.com",
  "www.tiktok.com",
  "m.tiktok.com",
  // `vm.tiktok.com` (mobile "Copy link") and `www.tiktok.com/t/…` (web share)
  // are short redirects. They only produce an embeddable id after the reels
  // beforeChange hook (`resolve-reel-url.ts`) follows the redirect and stores
  // the canonical `/@user/video/{id}` URL. Kept on the allow-list so an
  // unresolved paste still degrades to a safe `link-card` rather than being
  // treated as an unknown host.
  "vm.tiktok.com",
]);
const SPOTIFY_HOSTS = new Set(["open.spotify.com"]);

/** Spotify content types we support and the compact iframe height for each. */
const SPOTIFY_TYPE_HEIGHT: Record<string, number> = {
  episode: 232,
  track: 152,
  show: 352,
  playlist: 352,
  album: 352,
};

function safeUrl(input: string): URL | null {
  try {
    const url = new URL(input);
    // Only ever surface http(s) targets. This blocks `javascript:`, `data:`,
    // `vbscript:` etc. from becoming a link-card href or an iframe src.
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

function youTubeVideoId(url: URL): { id: string; isShort: boolean } | null {
  const isShort = url.pathname.startsWith("/shorts/");
  let videoId: string | null = null;

  if (url.hostname === "youtu.be" || url.hostname === "www.youtu.be") {
    videoId = url.pathname.slice(1).split("/")[0] || null;
  } else if (isShort) {
    videoId = url.pathname.split("/")[2] || null;
  } else if (url.pathname === "/watch") {
    videoId = url.searchParams.get("v");
  } else if (url.pathname.startsWith("/embed/")) {
    videoId = url.pathname.split("/")[2] || null;
  }

  if (!videoId || !/^[\w-]{6,}$/.test(videoId)) return null;
  return { id: videoId, isShort };
}

function instagramShortcode(
  url: URL
): { type: string; shortcode: string } | null {
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const type = parts[0];
  const shortcode = parts[1];
  if (!shortcode || !["p", "reel", "reels", "tv"].includes(type)) return null;
  if (!/^[\w-]+$/.test(shortcode)) return null;
  return { type, shortcode };
}

function tikTokVideoId(url: URL): string | null {
  // Canonical URL shape: https://www.tiktok.com/@user/video/1234567890
  // `vm.tiktok.com` short links can't be resolved without an HTTP call.
  const parts = url.pathname.split("/").filter(Boolean);
  const videoIdx = parts.indexOf("video");
  const id = videoIdx === -1 ? null : parts[videoIdx + 1];
  if (!id || !/^\d+$/.test(id)) return null;
  return id;
}

function vimeoVideoId(url: URL): string | null {
  // vimeo.com/123456789, vimeo.com/channels/x/123456789,
  // player.vimeo.com/video/123456789
  const parts = url.pathname.split("/").filter(Boolean);
  if (url.hostname === "player.vimeo.com") {
    const idx = parts.indexOf("video");
    const id = idx === -1 ? null : parts[idx + 1];
    return id && /^\d+$/.test(id) ? id : null;
  }
  // Last numeric path segment is the clip id.
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    if (/^\d+$/.test(parts[i])) return parts[i];
  }
  return null;
}

function spotifyEmbed(url: URL): ArticleEmbed | null {
  const parts = url.pathname.split("/").filter(Boolean);
  // Tolerate a leading locale/embed prefix like /intl-de or /embed.
  const typeIdx = parts.findIndex((p) => p in SPOTIFY_TYPE_HEIGHT);
  if (typeIdx === -1) return null;
  const type = parts[typeIdx];
  const id = parts[typeIdx + 1];
  if (!id || !/^[A-Za-z0-9]+$/.test(id)) return null;
  return {
    platform: "spotify",
    embedUrl: `https://open.spotify.com/embed/${type}/${id}`,
    externalUrl: url.toString(),
    layout: "audio",
    frameHeight: SPOTIFY_TYPE_HEIGHT[type],
  };
}

/** Build a safe link-out card for any valid http(s) URL we can't embed. */
function linkCard(url: URL): ArticleEmbed {
  return {
    platform: "link-card",
    embedUrl: null,
    externalUrl: url.toString(),
    layout: "card",
    title: url.hostname.replace(/^www\./, ""),
  };
}

/**
 * Parse a URL into an article embed descriptor.
 *
 * Returns `null` only for input that isn't a valid http(s) URL. Any valid
 * http(s) URL yields either an allow-listed platform embed or a `link-card`.
 */
export function parseEmbed(
  input: string | null | undefined
): ArticleEmbed | null {
  if (!input) return null;
  const url = safeUrl(input.trim());
  if (!url) return null;

  if (YOUTUBE_HOSTS.has(url.hostname)) {
    const yt = youTubeVideoId(url);
    if (!yt) return linkCard(url);
    return {
      platform: "youtube",
      embedUrl: `https://www.youtube.com/embed/${yt.id}?rel=0&modestbranding=1`,
      externalUrl: url.toString(),
      layout: "video",
      aspectRatio: yt.isShort ? "9 / 16" : "16 / 9",
    };
  }

  if (VIMEO_HOSTS.has(url.hostname)) {
    const id = vimeoVideoId(url);
    if (!id) return linkCard(url);
    return {
      platform: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${id}`,
      externalUrl: url.toString(),
      layout: "video",
      aspectRatio: "16 / 9",
    };
  }

  if (INSTAGRAM_HOSTS.has(url.hostname)) {
    const ig = instagramShortcode(url);
    if (!ig) return linkCard(url);
    return {
      platform: "instagram",
      embedUrl: `https://www.instagram.com/${ig.type}/${ig.shortcode}/embed/`,
      externalUrl: url.toString(),
      layout: "video",
      aspectRatio: "4 / 5",
    };
  }

  if (TIKTOK_HOSTS.has(url.hostname)) {
    const id = tikTokVideoId(url);
    if (!id) return linkCard(url);
    return {
      platform: "tiktok",
      embedUrl: `https://www.tiktok.com/embed/v2/${id}`,
      externalUrl: url.toString(),
      layout: "video",
      aspectRatio: "9 / 16",
    };
  }

  if (SPOTIFY_HOSTS.has(url.hostname)) {
    return spotifyEmbed(url) ?? linkCard(url);
  }

  // Unknown host → safe link-out. Never an iframe.
  return linkCard(url);
}

/**
 * Restricted parser for the homepage Reels rail: only the three portrait-video
 * platforms, and `null` for everything else (no link-card fallback). Preserves
 * the original `parseReelEmbed` contract so Reels callers are unchanged.
 */
export function parseReelEmbed(
  input: string | null | undefined
): ReelEmbed | null {
  if (!input) return null;
  const url = safeUrl(input.trim());
  if (!url) return null;

  if (YOUTUBE_HOSTS.has(url.hostname)) {
    const yt = youTubeVideoId(url);
    if (!yt) return null;
    return {
      platform: "youtube",
      embedUrl: `https://www.youtube.com/embed/${yt.id}?rel=0&modestbranding=1`,
      aspectRatio: yt.isShort ? "9 / 16" : "16 / 9",
      externalUrl: url.toString(),
      fitsPortraitCard: yt.isShort,
    };
  }

  if (INSTAGRAM_HOSTS.has(url.hostname)) {
    const ig = instagramShortcode(url);
    if (!ig) return null;
    return {
      platform: "instagram",
      embedUrl: `https://www.instagram.com/${ig.type}/${ig.shortcode}/embed/`,
      aspectRatio: "9 / 16",
      externalUrl: url.toString(),
      fitsPortraitCard: true,
    };
  }

  if (TIKTOK_HOSTS.has(url.hostname)) {
    const id = tikTokVideoId(url);
    if (!id) return null;
    return {
      platform: "tiktok",
      embedUrl: `https://www.tiktok.com/embed/v2/${id}`,
      aspectRatio: "9 / 16",
      externalUrl: url.toString(),
      fitsPortraitCard: true,
    };
  }

  return null;
}

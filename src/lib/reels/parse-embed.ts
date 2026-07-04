/**
 * Parse a social URL (Instagram, TikTok, YouTube, YouTube Shorts) into an
 * embeddable iframe descriptor. Returns null when the URL is unrecognised so
 * callers can fall back to a link-out card.
 */

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
const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com"]);
const TIKTOK_HOSTS = new Set(["tiktok.com", "www.tiktok.com", "vm.tiktok.com"]);

function safeUrl(input: string): URL | null {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

function parseYouTube(url: URL): ReelEmbed | null {
  const isShort = url.pathname.startsWith("/shorts/");
  let videoId: string | null = null;

  if (url.hostname === "youtu.be") {
    videoId = url.pathname.slice(1).split("/")[0] || null;
  } else if (isShort) {
    videoId = url.pathname.split("/")[2] || null;
  } else if (url.pathname === "/watch") {
    videoId = url.searchParams.get("v");
  } else if (url.pathname.startsWith("/embed/")) {
    videoId = url.pathname.split("/")[2] || null;
  }

  if (!videoId) return null;

  return {
    platform: "youtube",
    embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`,
    aspectRatio: isShort ? "9 / 16" : "16 / 9",
    externalUrl: url.toString(),
    fitsPortraitCard: isShort,
  };
}

function parseInstagram(url: URL): ReelEmbed | null {
  // Instagram supports /p/, /reel/, /reels/, /tv/ paths.
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const type = parts[0];
  const shortcode = parts[1];
  if (!shortcode || !["p", "reel", "reels", "tv"].includes(type)) return null;

  return {
    platform: "instagram",
    embedUrl: `https://www.instagram.com/${type}/${shortcode}/embed/`,
    aspectRatio: "9 / 16",
    externalUrl: url.toString(),
    fitsPortraitCard: true,
  };
}

function parseTikTok(url: URL): ReelEmbed | null {
  // Canonical URL shape: https://www.tiktok.com/@user/video/1234567890
  const parts = url.pathname.split("/").filter(Boolean);
  const videoIdx = parts.indexOf("video");
  if (videoIdx === -1 || !parts[videoIdx + 1]) {
    // vm.tiktok.com short links can't be resolved without an HTTP call —
    // mark as non-embeddable so the card links out.
    if (url.hostname === "vm.tiktok.com") {
      return null;
    }
    return null;
  }
  const videoId = parts[videoIdx + 1];

  return {
    platform: "tiktok",
    embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
    aspectRatio: "9 / 16",
    externalUrl: url.toString(),
    fitsPortraitCard: true,
  };
}

export function parseReelEmbed(input: string | null | undefined): ReelEmbed | null {
  if (!input) return null;
  const url = safeUrl(input.trim());
  if (!url) return null;

  if (YOUTUBE_HOSTS.has(url.hostname)) return parseYouTube(url);
  if (INSTAGRAM_HOSTS.has(url.hostname)) return parseInstagram(url);
  if (TIKTOK_HOSTS.has(url.hostname)) return parseTikTok(url);
  return null;
}

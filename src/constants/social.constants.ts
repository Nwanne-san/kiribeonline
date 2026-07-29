/**
 * Social platforms the public site can render. The `key` is the canonical value
 * stored on `site-settings.socialLinks[].platform` — the header's social rail
 * matches on it, so admin forms must save these exact lowercase keys.
 */
export const SOCIAL_PLATFORMS = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "twitter", label: "X (Twitter)" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
] as const;

export type SocialPlatformKey = (typeof SOCIAL_PLATFORMS)[number]["key"];

/** Normalize a stored/typed platform value to a canonical key ("X (Twitter)" → "twitter"). */
export function normalizeSocialPlatform(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

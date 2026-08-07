import type { CollectionBeforeValidateHook } from "payload";

type ReelPlatform = "instagram" | "tiktok" | "youtube";

/** Hostnames that count as belonging to a given platform (short + canonical). */
const PLATFORM_HOSTS: Record<ReelPlatform, RegExp> = {
  instagram: /(^|\.)instagram\.com$/i,
  tiktok: /(^|\.)tiktok\.com$/i,
  youtube: /(^|\.)(youtube\.com|youtu\.be)$/i,
};

/**
 * Reject the save when the pasted URL doesn't belong to the selected platform.
 *
 * The public renderer's `parseReelEmbed` already refuses to embed a mismatched
 * URL, but that means a reel silently degrades to nothing on the site — the
 * editor thinks it's live. Failing at save time surfaces the mistake right
 * where the paste happened.
 *
 * Also rejects anything that isn't a valid http(s) URL up front so garbage
 * pastes ("copy this link", `javascript:...`) never make it into the row.
 */
export const validateReelExternalUrl: CollectionBeforeValidateHook = ({
  data,
}) => {
  if (!data) return data;
  const platform = data.platform as ReelPlatform | undefined;
  const raw = data.externalUrl;
  if (!platform || typeof raw !== "string" || !raw.trim()) return data;

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error(
      "That doesn’t look like a valid link. Paste the full URL, including https://."
    );
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Reel links must start with http:// or https://.");
  }

  const expected = PLATFORM_HOSTS[platform];
  if (!expected) return data;
  if (!expected.test(url.hostname)) {
    const label =
      platform === "instagram" ? "Instagram"
        : platform === "tiktok" ? "TikTok"
          : "YouTube";
    throw new Error(
      `The link doesn't match the selected platform (${label}). Paste an ${label} URL or change the platform.`
    );
  }

  return data;
};

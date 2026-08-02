import type { CollectionBeforeChangeHook } from "payload";
import { needsResolution, resolveShortUrl } from "@/lib/embeds/resolve-url";

/**
 * Rewrite `externalUrl` to its canonical form when editors paste a short
 * redirect (e.g. `vm.tiktok.com/xxxxx` from the TikTok mobile app). Runs once
 * at save so `parseEmbed` at render time always sees a URL whose id it can
 * extract — otherwise the reel would silently degrade to the "Watch on
 * original site" fallback for every reader.
 *
 * Resolver is best-effort and swallows network failures (see
 * `resolveShortUrl`), so a bad DNS moment can't block an editor from saving.
 */
export const resolveReelExternalUrl: CollectionBeforeChangeHook = async ({
  data,
}) => {
  if (!data) return data;
  const raw = data.externalUrl;
  if (typeof raw !== "string" || !raw.trim()) return data;
  const trimmed = raw.trim();
  if (!needsResolution(trimmed)) return data;
  const resolved = await resolveShortUrl(trimmed);
  if (resolved === trimmed) return data;
  return { ...data, externalUrl: resolved };
};

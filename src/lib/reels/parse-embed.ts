/**
 * Compatibility shim. The embed parser was promoted to
 * `src/lib/embeds/parse-embed` in PLAN-EMBEDS Step 1. Reels callers keep
 * importing `parseReelEmbed` / `ReelEmbed` / `ReelPlatform` from here unchanged.
 */
export {
  parseReelEmbed,
  type ReelEmbed,
  type ReelPlatform,
} from "@/lib/embeds/parse-embed";

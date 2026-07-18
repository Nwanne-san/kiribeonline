/**
 * Fail-closed environment parsing helpers.
 *
 * Mirrors BrandDrive's `positiveIntEnv` posture: a malformed, zero, or negative
 * value never silently weakens a security control — it falls back to the safe
 * default instead. See docs/AUTH-HARDENING.md §3.
 */

/**
 * Parse a strictly-positive integer env var. Returns `fallback` for unset,
 * non-numeric, zero, or negative values (never throws, never returns ≤ 0).
 */
export function positiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

/** Parse a boolean env flag (`"true"`/`"1"` → true). Everything else → fallback. */
export function boolEnv(name: string, fallback = false): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (raw === undefined || raw === "") return fallback;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return fallback;
}

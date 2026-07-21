import { createHash, randomBytes } from "node:crypto";

/**
 * Password-reset tokens are valid for 30 minutes. Deliberately much shorter
 * than the 7-day invite window (invite-token.ts): a reset is user-initiated and
 * expected to be used within the same session, while an invite has to survive
 * an out-of-band handoff. AUTH-HARDENING §8.
 */
export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

/**
 * Generate a high-entropy reset token. The raw token is returned once (to be
 * emailed to the user) and is NEVER stored — only its SHA-256 hash is
 * persisted, so a DB dump cannot be used to reset passwords.
 *
 * Mirrors the invite-token util so both flows have identical crypto shape.
 */
export function generateResetToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: hashResetToken(raw) };
}

export function hashResetToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

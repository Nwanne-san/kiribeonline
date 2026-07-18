import { createHash, randomBytes } from "node:crypto";

/** Invite tokens are valid for 7 days (matches BrandDrive's invite window). */
export const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Generate a high-entropy invite token. The raw token is returned once (to be
 * emailed to the invitee) and is NEVER stored — only its SHA-256 hash is
 * persisted, so a DB dump cannot be used to accept invites.
 */
export function generateInviteToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: hashInviteToken(raw) };
}

export function hashInviteToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

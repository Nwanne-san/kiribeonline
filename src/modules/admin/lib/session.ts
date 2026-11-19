/**
 * 2 hours in milliseconds, matching DEFAULT_ADMIN_TOKEN_TTL_SECONDS (7200 seconds).
 */
export const ADMIN_SESSION_TTL_MS = 2 * 60 * 60 * 1000;

export const ADMIN_SESSION_EXPIRES_KEY = "kiribe_admin_session_expires_at";

export function setAdminSessionExpiry(ttlMs: number = ADMIN_SESSION_TTL_MS): void {
  if (typeof window === "undefined") return;
  try {
    const expiresAt = Date.now() + ttlMs;
    window.localStorage.setItem(ADMIN_SESSION_EXPIRES_KEY, String(expiresAt));
  } catch {
    // Ignore storage quota or disabled storage exceptions
  }
}

export function getAdminSessionExpiresAt(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ADMIN_SESSION_EXPIRES_KEY);
    if (!raw) return null;
    const num = Number(raw);
    return Number.isFinite(num) ? num : null;
  } catch {
    return null;
  }
}

export function clearAdminSessionExpiry(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ADMIN_SESSION_EXPIRES_KEY);
  } catch {
    // Ignore
  }
}

export function isAdminSessionExpired(): boolean {
  const expiresAt = getAdminSessionExpiresAt();
  if (expiresAt === null) return false;
  return Date.now() >= expiresAt;
}

# Auth Hardening Plan — Kiribe Online

Multi-role admin (admin / editor / writer / contributor) requires a stricter login,
authorization, and account-security posture. This plan is derived from a study of the
**BrandDrive backend** (NestJS) and adapted to our stack: **Next.js 15 + Payload CMS,
cookie-based sessions, a capability map, and a durable rate-limiter.**

Legend: ✅ done · 🔨 in progress · ⬜ planned

---

## 1. Authorization (capability model) — ✅ done

- ✅ Capability map in `src/server/access/roles.ts` (`ROLE_CAPABILITIES`, `can()`, `resolveRole()` fails **closed** to `contributor`).
- ✅ Server enforcement on every admin mutation via `requireAdminWriteCapability(request, cap)`.
- ✅ Collection + field-level access on Articles/Media/Categories/Tags/Creators/Reels + Homepage/SiteSettings globals (closes the native-REST bypass).
- ✅ Client reads its capabilities from `GET /api/admin/me` (`usePermissions`); server stays authoritative.
- **Skipped (not needed):** multi-tenant business/branch scoping (Kiribe is one org).

## 2. Login flow — 🔨 partial

- ✅ Cookie-based Payload session (httpOnly) — keep, do **not** adopt BrandDrive's body-returned bearer tokens (that's an API/mobile pattern).
- ✅ Generic, non-enumerating errors ("Invalid email or password") in `api/admin/auth/login`.
- ✅ Login rejects non-`active` accounts post-credential-check (pending/suspended get the same generic 401, no cookie).
- ✅ Cookie flags set: `httpOnly` + `secure` (prod) + `sameSite=lax`.
- ⬜ Confirm short access-token TTL (~1–2h) on the Users auth config (currently 7 days — BrandDrive uses `JWT_DURATION=3600`).

## 3. Rate limiting & brute-force — 🔨 partial

- ✅ Durable per-endpoint limiter already wraps login (`DEFAULT_ADMIN_LOGIN_RATE_LIMIT`) + IP/email buckets.
- ✅ Payload account lockout on the Users collection (`maxLoginAttempts: 5`, `lockTime: 600s`).
- ⬜ Tune to match BrandDrive posture: keep ~5–10 attempts; consider longer lock (up to 24h) for repeated offenders.
- ⬜ Tighten reset/OTP routes to ~5/min (BrandDrive's sensitive-route tier).
- ⬜ Fail-closed env parsing for any new numeric limits (BrandDrive `positiveIntEnv`).

## 4. Account status enforcement — ✅ done

- ✅ `requireAdminUser*` rejects `suspended` **and** `pending` (only `active` may act), regardless of role/capabilities.
- ✅ Self-lockout guards: an admin cannot change their own role/status or delete themselves (route + field-level).

## 5. Invite / onboarding — ✅ core done (email delivery pending)

- ✅ **Random, single-use, hashed invite token** (`crypto.randomBytes(32)`) with a 7-day expiry (`src/server/modules/users/invite-token.ts`).
- ✅ Only `inviteTokenHash` + `inviteTokenExpiresAt` stored (fields hidden + `read:()=>false`); raw token returned once to the inviting admin, never persisted.
- ✅ `POST /api/admin/auth/accept-invite` (public, IP-rate-limited, generic errors) → verify token + expiry → set password → flip `status` to `active` → clear token.
- ✅ Password policy at the Zod DTO layer (`adminPasswordSchema`: ≥10 chars, letter + number).
- ⬜ **Invite email delivery** — the endpoint currently returns the raw token to the admin; wire an email adapter so invitees receive the link directly.
- ⬜ Improve on BrandDrive: it uses a guessable encoded-id token — ours is already random+hashed. ✅

## 6. Session & token invalidation — 🔨 partial

- ✅ Suspended/pending rejected on the next request at the guard (no waiting for token expiry).
- ⬜ Forced logout on password reset (Payload invalidates on password change — verify).
- ⬜ Consider a `tokenVersion`/`sessions` bump to force logout on role change (BrandDrive revokes on privilege change). Lightweight; only if needed.

## 7. MFA / 2FA — ⬜ optional (v1+)

- ⬜ If added: prefer **TOTP** (otplib/speakeasy) over SMS; store secret encrypted; **add recovery/backup codes** (BrandDrive lacks these — improve here); gate behind an env kill-switch.

## 8. Audit & hardening hygiene — 🔨 partial

- ✅ `AuditLogs` collection + hooks record admin mutations; dashboard surfaces recent activity.
- ⬜ Also log auth events: login success/fail, lockout, invite accept, role/status change (via Payload `afterLogin`/collection hooks).
- ⬜ Use `crypto.randomInt` / `randomBytes` for any token or OTP (never `Math.random`).
- ⬜ Password reset: generic messaging, short-lived reset token, trial cap (BrandDrive `MAXIMUM_FORGET_PASSWORD_TRIAL_COUNT`).

---

## Reference
- BrandDrive backend: `/Users/.../BrandDrive/branddrive-backend` (auth module, `helpers/auth/*`, `decorators/UsePermission.decorator.ts`). Always mirror its strict posture for new auth work — see agent memory `branddrive-security-reference`.
- Related: [ARCHITECTURE.md](./ARCHITECTURE.md) (server layer), capability model in `src/server/access/roles.ts`.

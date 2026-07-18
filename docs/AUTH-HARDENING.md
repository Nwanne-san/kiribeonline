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

## 2. Login flow — ✅ done

- ✅ Cookie-based Payload session (httpOnly) — keep, do **not** adopt BrandDrive's body-returned bearer tokens (that's an API/mobile pattern).
- ✅ Generic, non-enumerating errors ("Invalid email or password") in `api/admin/auth/login`.
- ✅ Login rejects non-`active` accounts post-credential-check (pending/suspended get the same generic 401, no cookie).
- ✅ Cookie flags set: `httpOnly` + `secure` (prod) + `sameSite=lax`.
- ✅ **Short access-token TTL — 2h default** (`DEFAULT_ADMIN_TOKEN_TTL_SECONDS`, override `ADMIN_TOKEN_TTL_SECONDS`). Payload re-issues a token per authenticated request so active admins roll forward; idle sessions expire fast.

## 3. Rate limiting & brute-force — ✅ core done

- ✅ Durable per-endpoint limiter already wraps login (`DEFAULT_ADMIN_LOGIN_RATE_LIMIT`) + IP/email buckets.
- ✅ Payload account lockout on the Users collection (`maxLoginAttempts: 5`, **`lockTime: 900s` / 15m**), all env-tunable and fail-closed.
- ✅ **Fail-closed env parsing** — `positiveIntEnv` (`src/lib/env.ts`) + a hardened `resolveLimit` in `rate-limit.ts`: a malformed/zero/negative override never disables or weakens a limit.
- ✅ Sensitive tier constant available (`DEFAULT_ADMIN_SENSITIVE_RATE_LIMIT`, 5/min) for reset/OTP routes; accept-invite already IP-limited at 5/15m (stricter).
- ⬜ Optional: longer lock (up to 24h) for repeat offenders.

## 4. Account status enforcement — ✅ done

- ✅ `requireAdminUser*` rejects `suspended` **and** `pending` (only `active` may act), regardless of role/capabilities.
- ✅ Self-lockout guards: an admin cannot change their own role/status or delete themselves (route + field-level).

## 5. Invite / onboarding — ✅ done

- ✅ **Random, single-use, hashed invite token** (`crypto.randomBytes(32)`) with a 7-day expiry (`src/server/modules/users/invite-token.ts`).
- ✅ Only `inviteTokenHash` + `inviteTokenExpiresAt` stored (fields hidden + `read:()=>false`); raw token never persisted.
- ✅ `POST /api/admin/auth/accept-invite` (public, IP-rate-limited, generic errors) → verify token + expiry → set password → flip `status` to `active` → clear token.
- ✅ Password policy at the Zod DTO layer (`adminPasswordSchema`: ≥10 chars, letter + number).
- ✅ **Invite email delivery** via Resend (`src/server/modules/users/invite-email.ts` + `templates/admin-invite.ts`). Links to the new **`/admin/accept-invite`** page where the invitee sets a password. When email isn't configured (dev), the raw token is returned to the inviting admin as a fallback; when email succeeds, the token is **not** returned in the API response.
- ✅ Improve on BrandDrive: it uses a guessable encoded-id token — ours is already random+hashed.

## 6. Session & token invalidation — ✅ done

- ✅ Suspended/pending rejected on the next request at the guard (no waiting for token expiry).
- ✅ **Role/status changes take effect immediately** — `payload.auth()` re-reads the user from the DB each request, so `role`/`status` are always current at the capability guard. No `tokenVersion` needed.
- ✅ Forced logout on password change — setting a new password (accept-invite / reset) rotates Payload's salt/hash, invalidating previously issued tokens.

## 8b. Auth event audit — ✅ done

- ✅ Login **success** (`auth.login`) via a Users `afterLogin` hook (`src/payload/hooks/audit-auth.ts`).
- ✅ Login **failure** (`auth.login_failed`) and **status rejection** (`auth.login_rejected_status`) logged in the login route (generic, no user enumeration).
- ✅ **Invite issued** (`users.invited`) and **invite accepted** (`auth.invite_accepted`) logged in the users service.
- ✅ Role/status changes already captured by the Users `afterChange` audit hook.
- Note: rate-limit throttle events are intentionally **not** audited (avoids amplifying abuse into DB writes on the cheap-rejection path).

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

# Plan — Rate Limiting Hardening

Status: DRAFT (from 2026-07-04 review, findings R1–R7)
Touches: `src/lib/rate-limit.ts`, `src/lib/auth/client-ip.ts`,
`src/app/api/subscribe/confirm/route.ts`, admin write routes, `src/payload.config.ts`

## Goals

Rate limits that actually hold on serverless, keyed on an IP the client can't spoof,
covering every public write and the credential endpoint. Site must still work with
no Redis (CLAUDE.md stack constraint).

## Step 1 — Durable store with graceful fallback (R1)

Rework `src/lib/rate-limit.ts` behind the existing `checkRateLimit` /
`rateLimitForEndpoint` signatures so no route changes:

- If `REDIS_URL` is set: use Redis via a single lazy client (`ioredis`, or
  `@upstash/ratelimit` + `@upstash/redis` if we choose Upstash REST — decide by
  hosting: Vercel → Upstash REST; long-lived Node → ioredis). Sliding-window
  (`INCR` + `PEXPIRE` on first hit) keyed `rl:{endpoint}:{ip}`.
- If unset: keep the current in-memory Map (dev/local correctness) and log a
  one-time `console.warn` in production so the gap is visible, not silent.
- Return `retryAfterSeconds`; every 429 response sets a `Retry-After` header.
  Add a small `tooManyRequests(result)` helper so routes stay one-liners.

## Step 2 — Trusted client IP (R2)

`src/lib/auth/client-ip.ts`:

- Prefer the platform-set header that clients cannot forge: on Vercel use
  `x-vercel-forwarded-for` / `request.ip`; behind Cloudflare use `cf-connecting-ip`.
  Select via `TRUSTED_IP_HEADER` env (documented in `.env.example` +
  `docs/DEPLOYMENT.md`) with `x-forwarded-for` **last-hop** as fallback.
- Never let all unknowns share one bucket: fall back to a hash of UA + accept
  headers so the shared-bucket DoS ("unknown" starves everyone) goes away, while
  still failing closed enough to matter.

## Step 3 — Close uncovered endpoints (R3, R5, R7)

| Endpoint | Limit | Notes |
|---|---|---|
| `GET /api/subscribe/confirm` | 10 / 15 min / IP | token brute-force guard; constant-time token compare |
| `POST /api/admin/auth/login` | 5 / 15 min / IP **and** 10 / hour / email | tighten from 10/min; add per-identifier dimension |
| Admin writes (articles, media, categories, tags, reels, creators, homepage, settings) | 60 / min / **user id** | keyed on session user, not IP; one shared `admin_write` bucket via a tiny wrapper used by each route |
| `GET /api/health` | 30 / min / IP | cheap; also stop returning config booleans unauthenticated — return plain `{ ok: true }` publicly |

Add defaults to `src/constants/app.constants.ts` (no hardcoding in routes), all
overridable via `${ENDPOINT}_RATE_LIMIT` env as today.

## Step 4 — Fix window inconsistency (R6)

Pass `windowMs` explicitly at every call site: contact 5/15 min, subscribe 3/15 min
(current behavior, now explicit), everything else `RATE_LIMIT_WINDOW_MS`. Update
`docs/DEVELOPER.md` env table to state both limit **and** window per endpoint.

## Step 5 — Payload public surface (R4)

- If GraphQL is unused (it is — the app uses REST + local API): disable it in
  `payload.config.ts` (`graphQL: { disable: true }`) and remove the playground route.
- Payload REST catch-all: collection access control already restricts writes to
  admins; add read-rate protection at the edge (Cloudflare rule when the zone is
  set up — IMPLEMENTATION §3.2 "Cloudflare edge rules") rather than wrapping
  Payload's handler. Document as a deploy step in `docs/DEPLOYMENT.md`.

## Acceptance criteria

- With `REDIS_URL` set, limits persist across restarts and multiple instances
  (verify with two `next start` processes sharing one Redis).
- Spoofed `x-forwarded-for` does not change the bucket on the deployed platform.
- 6th login attempt in 15 min returns 429 with `Retry-After`.
- Burst-writing 61 admin mutations in a minute returns 429 without breaking normal
  editor flow.
- `/api/subscribe/confirm` throttles after 10 attempts.
- All existing endpoint tests/flows still pass with `REDIS_URL` unset.

## Review gates

`code-reviewer` mandatory (auth + list APIs). On completion check off
IMPLEMENTATION §3.2 login/admin-writes items and TRD §13 "Rate limiting on auth and
public writes"; reconcile the checklist duplication noted in the review.

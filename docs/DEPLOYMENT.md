# Kiribé Online — Deployment & Infrastructure

Authoritative guide to running the app in production. Companion docs:

- `docs/DEVELOPER.md` — application stack, module layout, build commands
- `docs/GIT-WORKFLOW.md` — branch model, PR flow, release cadence
- `docs/RESEND-CHECKLIST.md` — invite-email diagnostics
- `docs/AUTH-HARDENING.md` — admin session / lockout / invite hardening

Everything below assumes the branch model and the folder layout in
`docs/ARCHITECTURE.md` are already in place.

---

## Environment map

One Vercel project, branch-linked environments. Separate Neon branches per
environment; separate R2 buckets per environment.

| Git branch | Vercel target | Domain(s) | Neon branch | R2 bucket |
|---|---|---|---|---|
| `main` | Production | `kiribeonline.com` + `admin.kiribeonline.com` | `main` | `kiribe-media-prod` |
| `staging` | Preview (pinned) | `staging.kiribeonline.com` | `staging` | `kiribe-media-staging` |
| `develop` | Preview | `develop-<hash>.vercel.app` | `develop` | staging bucket |
| feature/* PRs | Preview | `*.vercel.app` | own ephemeral branch (Neon–Vercel integration; falls back to `develop`) | staging bucket |

Enable the **Neon–Vercel integration** so each preview deploy gets its own
database branch (created per PR, removed on merge). See
[`GIT-WORKFLOW.md → Database branches`](./GIT-WORKFLOW.md).

Set `ENVIRONMENT=production|staging|preview|development` in each Vercel
environment. Production must set `DISABLE_PAYLOAD_STUDIO=true` so editors use
the custom Kiribé admin only.

---

## 1. Folder structure

```
src/
├── middleware.ts                     # Host routing: admin.* → /admin/*, apex /admin → admin.*
├── app/
│   ├── (site)/                       # Public editorial site
│   ├── admin/                        # Custom admin (thin route files)
│   ├── (payload)/                    # Payload CMS (generated — do not hand-edit)
│   └── api/                          # App-owned endpoints
│       ├── admin/                    # Admin write API (capability-guarded)
│       ├── subscribe/                # Newsletter double opt-in
│       ├── contact/                  # Contact form
│       ├── cron/                     # Scheduled jobs (auth via CRON_SECRET)
│       └── health/                   # Liveness probe
├── modules/                          # Feature slices (pages/, components/, hooks/)
│   ├── editorial/                    # Public editorial UI
│   ├── admin/                        # Custom admin UI
│   ├── marketing/                    # About, contact, subscribe forms
│   ├── system/                       # Offline, error states
│   └── shared/                       # SiteLayout, shared UI primitives
├── server/                           # Domain logic (imported by route handlers)
│   ├── access/                       # Role + capability model
│   ├── auth/                         # Admin session, CSRF, cron secret, IP
│   ├── modules/<domain>/             # Service + DTO + types + access per domain
│   └── newsletter/                   # Mailchimp facade + typed result contract
├── payload/                          # Payload collections, globals, hooks
├── lib/
│   ├── email/                        # Resend client + templates
│   ├── storage/                      # R2 helpers (Payload owns the writes)
│   ├── audit/                        # Audit log writer
│   ├── rate-limit/                   # Redis/in-memory limiter
│   └── media/                        # Image downscale / dimensions
├── services/                         # HTTP client + high-level flows the UI calls
├── constants/                        # Numeric constants (limits, TTLs, quotas)
└── routes/                           # PublicRoutes / AdminRoutes enums

docs/                                 # This file, checklists, architecture, workflow
scripts/                              # One-off ops: create admin, seed, backfill
e2e/                                  # Playwright specs (auth setup + smoke)
.github/workflows/                    # CI + external cron for Hobby plan
vercel.json                           # Vercel cron entries
```

Rules of thumb:

- Route files in `src/app/` stay thin. Page logic lives in `src/modules/<domain>/pages/`.
- Server-side domain logic lives in `src/server/modules/<domain>/`. Route handlers import it.
- External integrations get their own service module (`src/server/newsletter/`, `src/lib/email/`, `src/lib/storage/`), never inlined into a route handler.
- `src/server/**` never imports from `src/modules/**` or React — those are server-only files.

---

## 2. Service architecture

```
             ┌──────────────────────────┐
  browser →  │ src/app/**/route.ts      │  Next.js route handler (thin)
             │  · validate input        │
             │  · call service          │
             │  · shape response        │
             └────────────┬─────────────┘
                          │
                          ▼
             ┌──────────────────────────┐
             │ src/server/modules/**    │  Domain service (repository + rules)
             │  · guards + capabilities │
             │  · calls Payload         │
             │  · calls integrations    │
             └────┬───────────┬─────────┘
                  │           │
                  ▼           ▼
       ┌────────────────┐ ┌──────────────────┐
       │ Payload (SQL)  │ │ Integrations     │
       │ Neon Postgres  │ │ · Resend         │
       └────────────────┘ │ · Mailchimp      │
                          │ · R2 (via Payload)│
                          └──────────────────┘
```

- `src/server/modules/*` never talks to the network directly. Email flows through `src/lib/email/*`, newsletter through `src/server/newsletter/*`, storage through Payload's S3 adapter.
- Every external integration returns a **typed result** (`NewsletterResult`, `sendTransactionalEmail: boolean`) and never throws for a business-level failure. Throws are reserved for programmer errors.
- The middleware is the ONLY host-aware layer. Nothing else reads `host` headers — services stay portable.

---

## 3. Environment variables

Managed exclusively via **Vercel → Project → Settings → Environment Variables**. Never commit values. Local dev loads from `.env.local` (git-ignored). All environments must be populated separately in Vercel.

### 3.1 Application

| Variable | Env | Notes |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | all | `https://kiribeonline.com` in prod. Full origin. |
| `NEXT_PUBLIC_API_URL` | all | Leave empty for this multi-host deployment. Browser API requests then stay on the current origin (`admin.` stays on `admin.`), preserving the session cookie and avoiding CORS. |
| `APP_URL` | all | Server-side canonical origin (invite links, redirects). |
| `ENVIRONMENT` | all | `development` / `preview` / `staging` / `production`. |
| `PRIMARY_HOST` | prod | `kiribeonline.com` (no `www.`). Middleware. |
| `ADMIN_HOST` | prod | `admin.kiribeonline.com`. Middleware. |
| `CSRF_ALLOWED_ORIGINS` | prod | Comma-separated. Include primary + admin origins. |
| `DISABLE_PAYLOAD_STUDIO` | prod/staging | `true` |

### 3.2 Database (Neon)

| Variable | Notes |
|---|---|
| `DATABASE_URL` | **Pooled** connection string (`...-pooler.<region>.aws.neon.tech`). |
| `PAYLOAD_SECRET` | Random 64-char string per environment. Rotate independently. |

Every non-prod branch runs on its own Neon **database branch** — never against the production DB.

### 3.3 Cloudflare R2

| Variable | Source |
|---|---|
| `R2_ACCOUNT_ID` | R2 → Overview |
| `R2_ACCESS_KEY_ID` | R2 API token (Object Read & Write) |
| `R2_SECRET_ACCESS_KEY` | R2 API token (shown once) |
| `R2_BUCKET_NAME` | e.g. `kiribe-media-prod` |
| `R2_S3_ENDPOINT` | Optional — required for jurisdiction buckets |
| `R2_PUBLIC_URL` | Full origin, no trailing slash |

### 3.4 Resend (transactional)

| Variable | Notes |
|---|---|
| `RESEND_API_KEY` | Live key (`re_live_...`) in prod. Test key blocks non-allowlist recipients. |
| `RESEND_FROM_EMAIL` | `Kiribé <noreply@send.kiribeonline.com>`. Must belong to a verified domain. |

### 3.5 Mailchimp (newsletter audience sync)

| Variable | Source |
|---|---|
| `MAILCHIMP_API_KEY` | Account → Extras → API keys |
| `MAILCHIMP_SERVER_PREFIX` | tail after `-` in the key (e.g. `us21`) |
| `MAILCHIMP_AUDIENCE_ID` | Audience → Settings → Audience name and defaults |
| `MAILCHIMP_FORCE_DOI` | Leave `false` — we run our own DOI. |

Leaving any of the three primary Mailchimp vars empty disables sync (the local double-opt-in still runs).

### 3.6 Authentication & cron

| Variable | Notes |
|---|---|
| `CRON_SECRET` | Random 48-char string. Sent as `Authorization: Bearer <secret>` by Vercel cron + the GitHub Actions workflow. |
| `ADMIN_TOKEN_TTL_SECONDS` | Default 7200 (2h). |
| `ADMIN_MAX_LOGIN_ATTEMPTS` | Default 5. |
| `ADMIN_LOCK_TIME_SECONDS` | Default 900 (15m). |
| `TRUSTED_IP_HEADER` | **Required** behind a CDN. Vercel: `x-vercel-forwarded-for`. Cloudflare: `cf-connecting-ip`. |

### 3.7 Rate limits & observability

See `.env.example` for the full list. Defaults live in `src/constants/app.constants.ts`. Sentry vars (`SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, etc.) are optional; the SDK is a no-op without a DSN.

---

## 4. Deployment flow

We deploy via **GitHub → Vercel Git integration**. There is no manual deploy step from a laptop.

```
feature branch  →  develop  →  staging  →  main
                     │           │          │
                     ▼           ▼          ▼
                  preview     staging    production
                   URL        subdomain  (kiribeonline.com,
                                          admin.kiribeonline.com)
```

- **feature/*** → open PR to `develop`. Every push creates a Vercel preview.
- **develop → staging** → PR (merge commit). Deploys to `staging.kiribeonline.com`.
- **staging → main** → release PR. Deploys to production.
- CI (`.github/workflows/ci.yml`) runs on all three long-lived branches: typecheck, lint, build.
- Release CI runs `payload migrate` against production on push to `main`.

Every Vercel deploy runs `next build` including the middleware, so the admin subdomain wiring is validated on every preview.

---

## 5. Middleware & host routing

The one host-aware layer in the app. Lives at `src/middleware.ts`.

**Behavior**

| Incoming | Middleware does |
|---|---|
| `admin.kiribeonline.com/` | rewrite → `/admin` (login → dashboard) |
| `admin.kiribeonline.com/dashboard` | rewrite → `/admin/dashboard` |
| `admin.kiribeonline.com/admin/dashboard` | pass through (internal `router.push` targets — no 308 hop) |
| `kiribeonline.com/admin` | 308 redirect → `https://admin.kiribeonline.com/` |
| `kiribeonline.com/admin/dashboard` | 308 redirect → `https://admin.kiribeonline.com/dashboard` |
| `www.kiribeonline.com/*` | 308 redirect → `kiribeonline.com/*` (apex canonical) |
| `*.vercel.app/*` | pass through (preview deploys share one URL) |
| `localhost:3000/*` | pass through (`/admin/*` reachable directly) |
| `admin.localhost:3000/*` | rewrite → `/admin/*` (parity testing) |

Assets and `/_next/*` are bypassed unconditionally so caching is untouched.

**Why not force the clean URL by redirecting on the admin subdomain?**

We considered 308-redirecting `admin.kiribeonline.com/admin/*` → `admin.kiribeonline.com/*` to canonicalise. But every internal `router.push("/admin/...")` on the client would then burn a redirect on each navigation. Admin pages are `noindex` so duplicate URLs don't cost SEO — accepting both shapes is simpler and faster.

**Env override**

`PRIMARY_HOST` and `ADMIN_HOST` env vars override the built-in defaults, so preview environments and staging can use `staging.kiribeonline.com` / `admin-staging.kiribeonline.com` if desired.

---

## 6. Email flow

Kiribé sends four kinds of transactional email — all through **Resend**. Business inboxes (`hello@`, `support@`, `admin@`) are hosted at **QServer** and receive replies. No SMTP is run in-house.

```
                                     ┌────────────┐
   reply email  ────────────────────►│  QServer   │  hello@kiribeonline.com
                                     │  MX records│  (mailbox host)
                                     └────────────┘

  ┌──────────────┐  1. render template     ┌──────────────┐
  │  src/server  │──────────────────────► │ src/lib/email│
  │  modules/*   │                        │   /resend.ts │
  └──────────────┘                        └──────┬───────┘
                                                 │  2. sendTransactionalEmail()
                                                 ▼
                                          ┌──────────────┐   3. deliver
                                          │    Resend    │────────────►  recipient
                                          └──────────────┘
```

Templates live in `src/lib/email/templates/*.ts` (subject/html/text bundle). Every render function is pure so tests don't need Resend running.

The client wrapper `sendTransactionalEmail` inspects Resend's `{ data, error }` response and returns `boolean`. It **never throws** on delivery failure — callers decide how to recover (fall back to a copy-link modal for invites, log for others). See `docs/RESEND-CHECKLIST.md` for the 7-step diagnostic.

Templates in the tree today: `admin-invite`, `admin-password-reset`, `subscribe-confirmation`. Add new ones alongside — never inline HTML in a route.

---

## 7. Newsletter flow

Mailchimp owns campaign creation, delivery, and unsubscribe management. The app only submits confirmed subscribers to the audience.

```
   subscribe form
        │
        ▼
   ┌──────────────────────┐   ┌────────────────────┐
   │ POST /api/subscribe  │──►│ services/subscribe │  1. create Payload row
   │  (rate limited)      │   │  .service.ts       │  2. send confirmation via Resend
   └──────────────────────┘   └────────┬───────────┘  (double-opt-in link)
                                       │
        user clicks confirm link       ▼
                                ┌────────────────┐   fire-and-forget
                                │ confirm route  │──────────────┐
                                └────────────────┘              │
                                                                ▼
                                                   ┌────────────────────────┐
                                                   │ server/newsletter/     │
                                                   │  mailchimp.service.ts  │
                                                   │  · PUT /lists/../members│
                                                   └────────────┬───────────┘
                                                                │
                                                                ▼
                                                          ┌───────────┐
                                                          │ Mailchimp │  campaigns
                                                          │  audience │──────────►  subscribers
                                                          └───────────┘
```

Design notes:

- **Two-stage flow.** Kiribé runs its own double opt-in (see `src/services/subscribe.service.ts`) so we're not blocked by Mailchimp's confirmation UX. Only *confirmed* subscribers make it into Mailchimp.
- **Fire-and-forget.** If Mailchimp is unreachable, the promise logs a warning and the user's confirmation still succeeds.
- **Idempotency.** The service uses `PUT /lists/{id}/members/{hash}` where `hash = md5(lowercase email)`. Repeated calls are safe.
- **Unsubscribe.** `unsubscribeNewsletterMember` marks the row `unsubscribed` (soft). Permanent deletes are done in the Mailchimp UI.
- **Segmentation.** Tags default to a `SOURCE` merge field so campaigns can filter website / import / manual.

---

## 8. File upload flow

R2 is the only object store — the app never persists uploads to the Vercel filesystem.

```
   admin editor                     ┌───────────────────┐
        │                            │  Payload CMS      │
        │  multipart POST            │  media collection │
        ▼                            │  (schema owner)   │
   ┌──────────────┐   valid?         └────────┬──────────┘
   │ /api/admin/  │──────────────────────────► │
   │ media (POST) │  · magic-byte check       │  storage-s3 adapter
   │  or Payload  │  · MIME whitelist         │
   │  admin       │  · downscale in-browser   │
   └──────┬───────┘                            │
          │                                     ▼
          │                            ┌────────────────┐
          │                            │ Cloudflare R2  │
          │                            │  · bucket      │
          │                            │  · public URL  │
          │                            └────────┬───────┘
          │                                     │
          ▼                                     ▼
      DB row referencing media                site renders via
      (id, alt, filename, r2 key)             R2_PUBLIC_URL
```

Rules:

- Upload endpoint validates: MIME whitelist (`image/jpeg,png,webp,gif`), `sharp`-driven magic-byte check, `MAX_UPLOAD_BYTES` guard.
- Browser downscales large images (`src/lib/media/downscale-image.ts`) before upload.
- Public URLs point at `R2_PUBLIC_URL`. Signed URLs are emitted only where a private asset would be needed — the media library is public-read since articles are public.
- Media documents keep `alt` required. The upload UI enforces this before hitting the API.

For signed URLs (future — private OG previews, etc.), extend `src/lib/storage/r2.ts` with `signGetUrl(key, ttl)` using `@aws-sdk/s3-request-presigner`.

---

## 9. Scheduled publishing flow

Editors set `status = scheduled` with a `publishedAt` in the future. A cron job flips the row to `published` when the moment arrives.

```
   /api/cron/publish-scheduled
   (auth: Bearer $CRON_SECRET)
             │
             ▼
   ┌────────────────────────┐
   │ publishScheduledArticles│  · SELECT status = scheduled AND publishedAt <= now
   │ (services/cron.service) │  · UPDATE status = published (per-row try/catch)
   └────────────┬────────────┘  · revalidateTag(articles, homepage)
                │
                ▼
      Payload update → afterChange hooks →
        · audit log entry (`articles.published`)
        · site cache revalidation
        · media usage recount
```

Trigger cadence:

| Environment | Trigger | Cadence |
|---|---|---|
| Local dev | manual: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/publish-scheduled` | on demand |
| Vercel Hobby (today) | GitHub Actions workflow | every 5 min |
| Vercel Pro (future) | `vercel.json` cron | every 5 min |

Idempotency: repeated calls promote nothing extra (`publishedAt <= now()` is monotonically shrinking). Per-article `try/catch` in the loop means a single broken row can't abort the batch — the next tick retries.

---

## 10. Cron configuration

Cron endpoints:

| Path | Purpose | Auth | Cadence |
|---|---|---|---|
| `/api/cron/publish-scheduled` | Flip scheduled → published | `CRON_SECRET` | every 5 min |
| `/api/cron/sitemap` | Rebuild sitemap.xml + revalidate | `CRON_SECRET` | daily 06:00 UTC |

Both routes call `requireCronSecret(request)` which compares the `Authorization: Bearer <secret>` header against `process.env.CRON_SECRET`. A missing or mismatched secret returns 401/503 — never 200. The endpoints are not linked from anywhere; they don't appear in nav, sitemap, or robots.txt.

### 10.1 Vercel cron entries (`vercel.json`)

```json
{
  "crons": [
    { "path": "/api/cron/sitemap", "schedule": "0 6 * * *" },
    { "path": "/api/cron/publish-scheduled", "schedule": "0 5 * * *" }
  ]
}
```

Hobby is capped at daily. When the project moves to Pro, tighten `publish-scheduled` to `*/5 * * * *` and delete `.github/workflows/publish-scheduled.yml`.

### 10.2 GitHub Actions external cron (Hobby workaround)

`.github/workflows/publish-scheduled.yml` runs every 5 min and hits the endpoint with `PUBLISH_CRON_TOKEN`. Required repo secrets:

- `PUBLISH_CRON_URL` — `https://kiribeonline.com/api/cron/publish-scheduled`
- `PUBLISH_CRON_TOKEN` — same value as `CRON_SECRET` on Vercel Production

The workflow uses `concurrency: publish-scheduled-articles` with `cancel-in-progress: false` so overlapping ticks queue instead of piling on.

---

## 11. DNS records

Namecheap owns the `kiribeonline.com` zone. Point the following:

### 11.1 Web hosts (Vercel)

| Type | Host | Value | Notes |
|---|---|---|---|
| A | `@` | `76.76.21.21` | Vercel IP for apex |
| CNAME | `www` | `cname.vercel-dns.com` | Redirects to apex via middleware |
| CNAME | `admin` | `cname.vercel-dns.com` | Admin subdomain (middleware rewrites) |

Then in Vercel → Project → Settings → Domains, add all three: `kiribeonline.com` (assigned to production), `www.kiribeonline.com` (redirect to apex), `admin.kiribeonline.com` (assigned to production; middleware handles the rewrite).

### 11.2 Business email (QServer)

Whatever MX records QServer provides — usually a pair:

| Type | Host | Value | Priority |
|---|---|---|---|
| MX | `@` | `mx1.qserver.com` | 10 |
| MX | `@` | `mx2.qserver.com` | 20 |
| TXT | `@` | `v=spf1 include:qserver.com ~all` | — |

Ask QServer for the current authoritative list — they occasionally rotate hosts. Confirm mail flow with a test-send to `hello@kiribeonline.com` after adding.

### 11.3 Transactional sending (Resend)

Resend gives you three TXT records — SPF, DKIM, DMARC. Copy them out of Resend's domain-verification screen and paste into Namecheap:

| Type | Host | Value |
|---|---|---|
| TXT | `send` | `v=spf1 include:amazonses.com ~all` |
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQ...` (long) |
| TXT | `_dmarc` | `v=DMARC1; p=none;` (start with `p=none`, tighten later) |

Wait 5–10 min, hit **Retry verification** in Resend. Both SPF and MX coexist because Resend sends from the `send.kiribeonline.com` subdomain.

### 11.4 R2 custom domain (optional but recommended)

If serving media from `media.kiribeonline.com`:

| Type | Host | Value |
|---|---|---|
| CNAME | `media` | `public.<hash>.r2.dev` (Cloudflare gives it) |

Add the custom domain in Cloudflare R2 → Bucket → Settings → Custom domains. Set `R2_PUBLIC_URL=https://media.kiribeonline.com` in Vercel prod.

---

## 12. Resend configuration

Once the DNS in §11.3 verifies:

1. **Domain** — Resend dashboard → Domains → `kiribeonline.com` shows **Verified** (green).
2. **From address** — Set `RESEND_FROM_EMAIL="Kiribé <noreply@send.kiribeonline.com>"` in Vercel Production. Display name freeform; the address must belong to the verified domain.
3. **API key** — Create a **Sending key** (Full access is fine for a single-app project). Store as `RESEND_API_KEY` in Vercel Production. Rotate on schedule.
4. **Webhook** *(deferred)* — Resend can POST delivery/bounce events. Add `/api/webhooks/resend` when we care about bounces; verify with the signing key.
5. **Suppression list** — Turn on "Automatic suppression list" so hard-bounces don't keep retrying.

Diagnostics: `docs/RESEND-CHECKLIST.md` walks through the 7 things to check when invites don't arrive.

---

## 13. Mailchimp configuration

1. **Audience** — one audience per environment (name them `Kiribé Newsletter (Prod)` / `(Staging)` so campaigns can't be misfired). Copy the ID from Audience → Settings → Audience name and defaults → **Audience ID**.
2. **API key** — Account → Extras → API keys → Create. The server prefix is the `-us21` (or similar) tail; store that as `MAILCHIMP_SERVER_PREFIX`.
3. **Double opt-in** — leave the Audience's DOI setting **off**. Kiribé runs its own DOI; enabling Mailchimp's on top means two confirmation emails.
4. **SOURCE merge field** — set to visible so campaigns can segment by source.
5. **Compliance footer** — set the physical address and unsubscribe copy in Audience → Settings → Required email footer content.
6. **Campaigns** — authored in the Mailchimp UI. The app doesn't call the campaign API.

Sync is fire-and-forget. Missed writes surface as `[newsletter] transport failure` in the Vercel logs; re-hit the confirm URL to retry.

---

## 14. Cloudflare R2 configuration

1. **Bucket** — R2 → Buckets → Create bucket (`kiribe-media-prod` in prod, `kiribe-media-staging` in staging). Location: `Automatic`. Storage class: `Standard`.
2. **API token** — R2 → Manage R2 API Tokens → Create API token → **Object Read & Write** scoped to that bucket. Save both keys (secret is shown once).
3. **Public access** — enable "Public Development URL" for a quick `pub-<hash>.r2.dev`, or (preferred) add a custom domain (see §11.4). CORS is not required for public GETs.
4. **Lifecycle rules** *(optional)* — none needed for editorial content. If we ever accept user uploads, add a rule to expire orphaned objects after 30 days.
5. **Verify** — `npm run r2:check` after setting env vars. Uploads/deletes a tiny test object; refuses to run if any of the four core vars is missing.

`R2_PUBLIC_URL` must be a **full origin, no trailing slash**. The site renders images by joining `R2_PUBLIC_URL + /<key>`.

---

## 15. Trusted client IP (required behind a CDN)

`TRUSTED_IP_HEADER` is **mandatory in production behind a CDN**. Without it, in-app
rate limits key on `x-forwarded-for` / `x-real-ip`, which resolve to the CDN edge —
so limits collapse to a per-edge bucket shared by many callers. Set it to the
platform header the client cannot forge:

- **Cloudflare:** `TRUSTED_IP_HEADER=cf-connecting-ip`
- **Vercel (default):** `TRUSTED_IP_HEADER=x-vercel-forwarded-for`

---

## 16. Cloudflare CDN (production)

Cache static assets aggressively. Short TTL on `/api/articles` aligned with `LIST_REVALIDATE_SECONDS` (60s). Purge cache after bulk publish or deploy if needed.

### 16.1 Edge rate-limit rules (Payload REST catch-all)

App routes (`/api/*`) enforce rate limits in code, but the Payload REST catch-all (`/api/[...slug]`) is not wrapped. Writes there are already restricted to admins by collection access control; add an **edge** limit to protect the **read** surface from scraping:

1. In the Cloudflare zone, add a **Rate Limiting Rule** matching `http.request.uri.path contains "/api/"` — scoped to the Payload slug paths.
2. Suggested budget: ~60 requests / minute / IP (mirrors the in-app list limits), action **Block** with a 429 for the remainder of the window.
3. Set `TRUSTED_IP_HEADER=cf-connecting-ip` so in-app limits key on the same IP Cloudflare sees.

GraphQL is disabled in `payload.config.ts`, so no `/api/graphql*` surface needs a rule.

---

## 17. First admin user

```bash
DATABASE_URL=... PAYLOAD_SECRET=... npm run create-admin \
  -- --email you@example.com --password 'YourSecurePassword'
```

Run once per environment after `payload migrate`.

---

## Deployment checklist

Copy-paste ready. Run through before flipping DNS to production.

**Vercel**

- [ ] Production environment vars set (§3 table)
- [ ] Preview environment vars set (subset — different DB branch, test Resend key OK)
- [ ] Domains added: `kiribeonline.com`, `www.kiribeonline.com`, `admin.kiribeonline.com`
- [ ] Serverless region set close to Neon (us-east-1 for us-east Neon)

**Database (Neon)**

- [ ] Production DB branch created; `DATABASE_URL` uses the pooled connection string
- [ ] `payload migrate` has run on production (Release CI handles this on push to main)

**DNS (Namecheap)**

- [ ] `A @ → 76.76.21.21`
- [ ] `CNAME www → cname.vercel-dns.com`
- [ ] `CNAME admin → cname.vercel-dns.com`
- [ ] MX + SPF for QServer (business email)
- [ ] SPF + DKIM + DMARC for Resend (transactional)
- [ ] (optional) `CNAME media → public.<hash>.r2.dev` for a custom media domain

**Resend**

- [ ] Domain verified (green)
- [ ] `RESEND_API_KEY` is a `re_live_*` key (not test)
- [ ] Test invite lands in a real inbox

**Mailchimp**

- [ ] Audience created + ID copied
- [ ] API key + server prefix set in Vercel
- [ ] Compliance footer + physical address filled
- [ ] Double-opt-in setting on the Audience is **OFF** (we run our own)

**Cloudflare R2**

- [ ] Bucket created
- [ ] API token created (Read & Write, bucket-scoped)
- [ ] `R2_PUBLIC_URL` reachable in a browser (`curl -I` returns 200)
- [ ] `npm run r2:check` passes locally against prod credentials

**Cron**

- [ ] `CRON_SECRET` set in Vercel Production
- [ ] `PUBLISH_CRON_URL` + `PUBLISH_CRON_TOKEN` set as GitHub repo secrets
- [ ] GitHub Actions workflow enabled (Actions tab → workflow runs green)

**Post-deploy sanity**

- [ ] `kiribeonline.com/admin` → redirects to `admin.kiribeonline.com/`
- [ ] `admin.kiribeonline.com/login` → renders the login form
- [ ] Invite a test admin — email arrives via Resend
- [ ] Subscribe from the public site — confirmation lands, Mailchimp audience count increments
- [ ] Schedule an article 10 min out — publishes on time (see the GitHub Actions workflow logs)

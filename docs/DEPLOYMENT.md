# Deployment — Kiribe Online

One Vercel project, branch-linked environments, separate Neon branches and R2 buckets.

## Environment map

| Git branch | Vercel | Domain | Neon branch | R2 bucket |
|------------|--------|--------|-------------|-----------|
| `main` | Production | `kiribeonline.com` (client domain) | `main` | `kiribe-media-prod` |
| `staging` | Preview (pinned) | `staging.kiribeonline.com` | `staging` | `kiribe-media-staging` |
| `develop` | Preview (pinned, optional) | `dev.kiribeonline.com` or `*.vercel.app` | `dev` branch (or staging) | staging bucket |
| feature PRs | Preview | `*.vercel.app` | dev/staging DB OK for QA | staging bucket |

Set `ENVIRONMENT=production|staging|development` in each Vercel environment.

Production must set `DISABLE_PAYLOAD_STUDIO=true` so editors use the custom Kiribe admin only.

## Neon PostgreSQL

1. Create a Neon project.
2. Use the **main** branch connection string for production `DATABASE_URL`.
3. Create a **staging** branch; use its connection string for the staging Vercel env.
4. Run migrations after schema changes:

```bash
npm run migrate
```

On first deploy per environment, run migrations before or as part of release.

## Cloudflare R2

Create two buckets (or one bucket with prefixes — buckets preferred):

- `kiribe-media-prod` — production uploads
- `kiribe-media-staging` — staging uploads

Set per environment in Vercel:

- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL` — public CDN URL for each bucket

## Vercel setup

1. Import the GitHub repo as one Vercel project.
2. **Production branch:** `main`
3. Assign production domain on `main`.
4. Add **staging** branch; assign `staging.yourdomain.com` to that branch preview.
5. Copy env vars from [`.env.example`](../.env.example) into Vercel (Production vs Preview vs Development scopes).

### Required env vars (all deploys)

| Variable | Production | Staging |
|----------|------------|---------|
| `DATABASE_URL` | Neon main | Neon staging |
| `PAYLOAD_SECRET` | unique strong secret | unique strong secret |
| `NEXT_PUBLIC_APP_URL` | `https://kiribeonline.com` | `https://staging.kiribeonline.com` |
| `NEXT_PUBLIC_API_URL` | `{APP_URL}` (no `/api` suffix) | same pattern |
| `CRON_SECRET` | random bearer token | different token |
| `DISABLE_PAYLOAD_STUDIO` | `true` | `true` (or `false` for debugging) |
| `R2_*` | prod bucket | staging bucket |

Optional: separate `NEXT_PUBLIC_GA_MEASUREMENT_ID` per environment.

## Cron jobs

[`vercel.json`](../vercel.json) schedules:

- `/api/cron/publish-scheduled` — every 5 minutes
- `/api/cron/sitemap` — daily 06:00 UTC

Vercel sends `Authorization: Bearer {CRON_SECRET}`. Set `CRON_SECRET` in Vercel env.

## Branch workflow

Full conventions in [`docs/GIT-WORKFLOW.md`](GIT-WORKFLOW.md). Route:

1. Feature branch from `develop` (`feat/<slug>`); PR → `develop` (squash). Preview deploy + CI on the PR.
2. Promotion PR `develop` → `staging` (merge commit); QA on the staging subdomain.
3. Release PR `staging` → `main` (merge commit) for production.
4. Never point production `DATABASE_URL` at staging/dev Neon.

## Migrations on release

```bash
# Local against target DB
DATABASE_URL=... npm run migrate

# Or add to Vercel build (optional):
# npm run migrate && npm run build
```

## Trusted client IP (required behind a CDN)

`TRUSTED_IP_HEADER` is **mandatory in production behind a CDN**. Without it, in-app
rate limits key on `x-forwarded-for` / `x-real-ip`, which resolve to the CDN edge —
so limits collapse to a per-edge bucket shared by many callers. Set it to the
platform header the client cannot forge:

- **Cloudflare:** `TRUSTED_IP_HEADER=cf-connecting-ip`
- **Vercel:** `TRUSTED_IP_HEADER=x-vercel-forwarded-for`

## Cloudflare CDN (production)

Cache static assets aggressively. Short TTL on `/api/articles` aligned with `LIST_REVALIDATE_SECONDS` (60s). Purge cache after bulk publish or deploy if needed.

### Edge rate-limit rules (Payload REST catch-all)

App routes (`/api/*`) enforce rate limits in code, but the Payload REST
catch-all (`/api/[...slug]`) is not wrapped. Writes there are already restricted
to admins by collection access control; add an **edge** limit to protect the
**read** surface from scraping/abuse:

1. In the Cloudflare zone, add a **Rate Limiting Rule** matching
   `http.request.uri.path contains "/api/"` and **not** the app routes above
   (or scope it to the Payload slug paths).
2. Suggested budget: ~60 requests / minute / IP (mirrors the in-app list limits),
   action **Block** with a 429 for the remainder of the window.
3. Set `TRUSTED_IP_HEADER=cf-connecting-ip` so in-app limits key on the same IP
   Cloudflare sees (see DEVELOPER.md env table).

GraphQL is disabled in `payload.config.ts`, so no `/api/graphql*` surface needs a rule.

## First admin user

```bash
DATABASE_URL=... PAYLOAD_SECRET=... npm run create-admin -- --email you@example.com --password 'YourSecurePassword'
```

Run once per environment after migrate.

## Custom admin

Editors use `/admin/login` (Kiribe UI), not Payload Studio. Payload remains headless CMS + auth backend.

Payload Studio (dev/emergency) lives at `/payload-studio` when `DISABLE_PAYLOAD_STUDIO=false`. Custom Kiribe admin owns `/admin/*`.

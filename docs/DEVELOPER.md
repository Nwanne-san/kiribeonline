# Kiribe Online — Developer Guide

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| UI | **MUI 7** (`@mui/material`, `@mui/icons-material`, `@mui/material-nextjs`) |
| Styling | MUI theme + Tailwind utilities |
| CMS | Payload CMS (Phase 1) |
| Database | Neon PostgreSQL |
| Media | Cloudflare R2 |
| Edge | Cloudflare (cache, rate limit) |
| Data fetching | TanStack Query 5, Axios |
| Optional later | Redis (hot cache, rate-limit counters) |

## Local setup

```bash
cd /Users/nwannennamani/Documents/KiribeOnline
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Common commands

```bash
npm run dev        # Turbopack dev server
npm run build      # Production build
npm run start      # Production server
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

## Environment variables

See `.env.example`. Never commit `.env.local`.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | Canonical site URL |
| `NEXT_PUBLIC_API_URL` | Site origin for axios client (e.g. `http://localhost:3000` — do **not** append `/api`; service paths include it) |
| `PAYLOAD_SECRET` | Payload encryption secret |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `R2_*` | Cloudflare R2 credentials |
| `FIGMA_FILE_KEY` | Design file key for MCP sync |
| `FIGMA_ACCESS_TOKEN` | Local only — Figma REST/MCP |
| `CRON_SECRET` | Bearer token for `/api/cron/*` routes |
| `CONTACT_RATE_LIMIT` | `POST /api/contact` — limit per IP / **15 min window** (default 5) |
| `SUBSCRIBE_RATE_LIMIT` | `POST /api/subscribe` — limit per IP / **15 min window** (default 3) |
| `SUBSCRIBE_CONFIRM_RATE_LIMIT` | `GET /api/subscribe/confirm` — limit per IP / **15 min window** (default 10; token brute-force guard) |
| `ARTICLES_RATE_LIMIT` | `GET /api/articles` (+ `/api/categories`) — limit per IP / **1 min window** (default 60) |
| `SEARCH_RATE_LIMIT` | `GET /api/search` — limit per IP / **1 min window** (default 30) |
| `ANALYTICS_VIEW_RATE_LIMIT` | `POST /api/analytics/view` — limit per IP / **1 min window** (default 120) |
| `HEALTH_RATE_LIMIT` | `GET /api/health` — limit per IP / **1 min window** (default 30) |
| `ADMIN_LOGIN_RATE_LIMIT` | `POST /api/admin/auth/login` — limit per IP / **15 min window** (default 5) |
| `ADMIN_LOGIN_EMAIL_RATE_LIMIT` | `POST /api/admin/auth/login` — limit per email / **1 hour window** (default 10) |
| `ADMIN_WRITE_RATE_LIMIT` | All admin write routes (shared `admin_write` bucket) — limit per session user id / **1 min window** (default 60) |
| `REDIS_URL` | Durable rate-limit store (ioredis). Unset → in-memory Map (dev only; warns once in prod) |
| `TRUSTED_IP_HEADER` | Platform header with the real client IP (e.g. `cf-connecting-ip`, `x-vercel-forwarded-for`). Unset → `x-forwarded-for` last hop |
| `LIST_REVALIDATE_SECONDS` | ISR revalidate for list API routes (default 60) |
| `ENVIRONMENT` | `development` \| `staging` \| `production` |
| `DISABLE_PAYLOAD_STUDIO` | `true` in prod — editors use custom `/admin` only |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 measurement ID (public site only, optional) |
| `R2_PUBLIC_URL` | Public base URL for R2 media |
| `CONTACT_TO_EMAIL` | Optional notification email for contact form |

## Architecture

```
KiribeOnline/
├── docs/                      # PRD, TRD, design, deployment, implementation
├── types/                     # Global service types
├── scripts/                   # create-admin, etc.
├── src/
│   ├── app/
│   │   ├── (site)/            # Public editorial pages
│   │   ├── admin/             # Custom Kiribe admin (primary editor UX)
│   │   └── (payload)/         # Payload headless (Studio optional)
│   ├── modules/
│   │   ├── editorial/         # Public editorial UI
│   │   ├── admin/             # Custom admin UI + pages
│   │   ├── marketing/
│   │   └── shared/
│   ├── services/              # API endpoint definitions
│   ├── routes/                # Route path enums
│   ├── constants/             # App-wide defaults
│   ├── lib/                   # Server infra (auth, content, admin)
│   └── utils/                 # Client helpers + hooks
└── .claude/
```

### Patterns (from CW-real-estate)

1. **Thin routes** — `src/app/**/page.tsx` imports from `src/modules/**`.
2. **Route enums** — use `PublicRoutes` / `AdminRoutes`, not string literals.
3. **Service layer** — endpoint configs in `src/services/*.service.ts`.
4. **HTTP client** — singleton `src/utils/client.ts` with cookie auth.
5. **React Query hooks** — `useQueryService`, `useInfiniteQueryService`, `useMutationService` in `src/utils/hooks/`.
6. **URL list state** — `usePagination`, `useFilter`, `useDebouncedUrlParam`, `useListViewMode` for editorial lists.
7. **App constants** — change list defaults in `src/constants/app.constants.ts` (page size, debounce, cache TTL).
8. **Forms** — Zod schemas in `src/lib/validation/`; `useFormValidator` + MUI form components.
9. **App API** — validate with Zod → rate limit → service in `src/services/` or `src/lib/content/` → Payload.

### Auth model (TRD §9)

- Single admin role in v1
- **Custom Kiribe admin** at `/admin/*` — primary editor UX (MUI)
- **Payload** provides headless CMS, PostgreSQL, media storage, and session auth
- Server-side `requireAdminUser()` on all `/api/admin/*` and protected `/admin/*` pages (Payload session cookie)
- No custom `middleware.ts`; no parallel JWT/`accessToken` auth for admin
- Production: `DISABLE_PAYLOAD_STUDIO=true` — Payload Studio not exposed to editors
- First user: `npm run create-admin` (see [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md))

## Figma MCP setup

Add to **Cursor Settings → MCP** (project or user level):

```json
{
  "mcpServers": {
    "figma": {
      "type": "http",
      "url": "https://mcp.figma.com/mcp"
    }
  }
}
```

For the local `user-Figma` REST server, set `FIGMA_ACCESS_TOKEN` in MCP env (not in git).

**File:** `iBC8YfVwanBDq1nh1VTS9f`

Tools: `get_figma_data`, `download_figma_images`, `extract_styles`.

If you get 403: the token account needs view access to the Figma Make file. Share the file with that account or regenerate a token with `file:read` scope.

## Caching and CDN

| Layer | Implementation |
|-------|----------------|
| App list APIs | `GET /api/articles`, `GET /api/search` — `revalidate` from `LIST_REVALIDATE_SECONDS` |
| On publish | Payload `afterChange` → `revalidateTag('articles')` |
| TanStack Query | Global `LIST_STALE_TIME_MS` (5 min); search uses `SEARCH_STALE_TIME_MS` (0) |
| Paginated UX | `keepPreviousData` on list queries for slow networks |

**Cloudflare (production):** cache static assets aggressively; consider edge cache rules for `/api/articles` with short TTL aligned to `LIST_REVALIDATE_SECONDS`. Purge on deploy or after bulk publish.

Change list page size defaults in `src/constants/app.constants.ts`.

## Deploy

Target: Vercel or similar for Next.js; Neon and R2 external.

Environments: development, staging, production (TRD §8.6).

## Phasing (from PRD)

| Phase | Focus |
|-------|--------|
| 1 Foundation | Design system, envs, Payload, DB, R2 |
| 2 Core | Homepage, articles, archive, admin workflow |
| 3 Resilience | Cache, rate limit, offline, traffic spikes |
| 4 Optimization | SEO, analytics, performance |

## Code audit notes

- Middleware uses cookies only; sync with Payload session when CMS is added.
- Redis is optional in v1 — do not block launch on it.
- Keep admin and public concerns in separate modules.

## Related docs

- `docs/DESIGN.md` — visual system
- `docs/IMPLEMENTATION.md` — build checklist
- `docs/USER-FLOW.md` — stakeholder journeys
- `docs/PROJECT.md` — repo overview

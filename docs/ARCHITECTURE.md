# Architecture — Kiribe Online

This doc explains **where code lives** and **how to add features** without the repo turning into a maze.

---

## Three layers (never mix them)

| Layer | Path | Responsibility |
|-------|------|----------------|
| **Routes** | `src/app/` | URLs only. Import a page from `src/modules/`, or (for `api/`) call a `src/server/` module. No business logic. |
| **Features** | `src/modules/` | UI, hooks, page views grouped by product area. |
| **Server (domain)** | `src/server/` | Backend domain logic grouped by domain (service + dto + types + access), plus auth guards and the capability model. |
| **Platform** | `src/payload/`, `src/lib/` | CMS schema (`payload/`) and generic infra: HTTP helpers, storage, DB, rate-limit, public validation (`lib/`). |

**Rule:** JSX for a page → `modules/`. A collection field → `payload/`. A domain's server logic (an admin service, its Zod DTO, its access rule) → `src/server/modules/<domain>/`. Generic, domain-agnostic infra (R2, health, rate-limit, `getPayloadClient`) → `lib/`.

### `src/server/` — domain-oriented backend (BrandDrive-style)

Route handlers must live under `src/app/api/` (Next.js) and entities under `src/payload/` (Payload), so a full NestJS-style module isn't possible. Everything *else* for a domain is co-located:

```
src/server/
├── access/roles.ts          # Capability model: roles, ROLE_CAPABILITIES, can(), resolveRole()
├── auth/                     # Guards + session (the "auth module")
│   ├── session.ts            # Payload session → AdminUser (role/status), suspended/pending gates
│   ├── capability.ts         # requireAdminCapability / requireAdminWriteCapability
│   ├── admin-write.ts        # auth + shared rate-limit for mutations
│   ├── admin-api.ts          # route error handling
│   ├── auth.dto.ts           # loginSchema
│   ├── client-ip.ts, cron.ts
│   └── index.ts              # barrel → import from "@/server/auth"
├── shared/                   # Cross-domain primitives
│   ├── types.ts              # AdminMediaRef, AdminTermRef, AdminAuthorRef, AdminListResult
│   └── text-to-lexical.ts
└── modules/<domain>/         # one folder per domain
    ├── <domain>.service.ts   # business logic (Payload Local API, overrideAccess)
    ├── <domain>.dto.ts       # Zod: API-input schemas + RHF form schemas
    ├── <domain>.types.ts     # domain view-model types
    ├── <domain>.access.ts    # domain-specific Payload access (e.g. articles.access.ts)
    └── index.ts              # barrel → import from "@/server/modules/<domain>"
```

**Import conventions**
- Controllers (`app/api/admin/<domain>/route.ts`) import guards from `@/server/auth` and logic from `@/server/modules/<domain>`.
- Payload collections import generic access glue from `../access` (`requireCapability`, `adminRoleOnly`, `denyFieldWrite`, `denySelfFieldMutation`) and domain field-access from `@/server/modules/<domain>/<domain>.access`.
- Client components may `import type` view-model types from `@/server/modules/*` — **types only** (never runtime values; server code must not enter client bundles).
- The capability contract in `src/server/access/roles.ts` is the single source of truth for both server enforcement and the client's `usePermissions` hook (`/api/admin/me`).

---

## Folder map

```
src/
├── app/
│   ├── layout.tsx              # Root: fonts, providers, globals
│   ├── providers.tsx
│   ├── (site)/                 # Public website (reader-facing)
│   │   ├── layout.tsx          # SiteLayout + SiteSettings from CMS
│   │   ├── page.tsx            # → modules/editorial/pages/HomePage (CMS-driven)
│   │   ├── articles/
│   │   └── ...
│   ├── admin/                  # Custom Kiribe admin (primary editor UX)
│   │   ├── layout.tsx          # Session guard + AdminShell
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── articles/
│   │   ├── homepage/
│   │   └── ...
│   ├── (payload)/              # Payload CMS (DO NOT EDIT generated files)
│   │   ├── payload-studio/     # Payload Studio catch-all (dev/emergency only)
│   │   └── api/                # REST + GraphQL at /api/*
│   └── api/                    # App-owned API
│       ├── admin/              # Authenticated admin mutations (articles, homepage, media, …)
│       ├── analytics/view/     # Public viewCount increment
│
├── modules/                    # Feature code — grow here
│   ├── editorial/              # Homepage, articles, archive, search
│   │   ├── pages/              # Full page components
│   │   ├── components/         # Editorial-only UI
│   │   └── hooks/              # Data hooks for editorial
│   ├── marketing/              # About, contact, subscribe
│   ├── admin/                  # Custom Kiribe admin UI (MUI)
│   ├── system/                 # Offline, error states
│   └── shared/                 # Cross-feature layouts + UI primitives
│       ├── layouts/
│       ├── components/
│       │   ├── ui/             # KiribeTextField, KiribeButton, KiribeLink, …
│       │   ├── form/           # RHF wrappers (FormTextField, FormTextArea)
│       │   ├── feedback/       # DataRenderer, RichTextRenderer, Snackbar
│       │   └── media/          # KiribeImage, KiribeImageViewer
│       └── types/
│
├── payload/                    # CMS layer — isolated from React modules
│   ├── collections/            # Articles, Categories, Tags, Media, Users, AuditLogs, Subscribers, ContactMessages
│   ├── globals/                # SiteSettings, Homepage
│   ├── fields/                 # Reusable field configs (slug, SEO)
│   ├── hooks/                  # Audit logging on admin mutations
│   └── access/                 # Access control helpers
│
├── server/                     # Domain-oriented backend (see "src/server/" above)
│   ├── access/roles.ts         # Capability model (source of truth)
│   ├── auth/                   # Session, capability guards, admin-write, login DTO
│   ├── shared/                 # Cross-domain types + text-to-lexical
│   └── modules/<domain>/       # service + dto + types + access per domain
│
├── lib/                        # Generic infrastructure (no React, no domain logic)
│   ├── api/                    # apiSuccess, parseBody (Zod), handleRouteError
│   ├── audit/                  # writeAuditLog helper
│   ├── validation/             # PUBLIC Zod schemas only (contact, subscribe, helpers)
│   ├── content/                # Article list queries, filters, pagination helpers
│   ├── url/                    # build-list-query helpers
│   ├── rate-limit.ts           # Per-endpoint IP sliding window
│   ├── payload/                # getPayloadClient()
│   ├── storage/                # R2 + media URL helpers
│   └── db/                     # DB env checks
│
├── services/                   # HTTP endpoint configs for client hooks
├── routes/                     # Path enums — use everywhere
├── constants/                  # App-wide non-secret defaults (pagination, cache, URL params)
├── utils/                      # Client-safe helpers + React Query hooks
└── theme/                      # Tailwind tokens
```

---

## Route groups in `app/`

### `(site)` — public website

- All reader URLs live here.
- Wrapped in `SiteLayout` (header, footer).
- Each `page.tsx` is **one import**:

```tsx
import { ArticlesPage } from "@/modules/editorial/pages/ArticlesPage";

export default function Page() {
  return <ArticlesPage />;
}
```

### `(payload)` — headless CMS

- Auto-generated Payload files. **Do not edit** except `importMap.js` via `npm run generate:importmap`.
- Payload Studio catch-all: `/payload-studio/*` when `DISABLE_PAYLOAD_STUDIO=false` (dev only).
- REST API: `/api/articles`, etc.

**Editors use the custom Kiribe admin at `src/app/admin/`**, not Payload Studio.

### `admin/` + `api/admin/` — custom editor UX

- Login: `/admin/login` → `POST /api/admin/auth/login` (Payload session cookie).
- All `/api/admin/*` routes authenticate first: reads via `requireAdminUserFromRequest`, mutations via `requireAdminWriteCapability(request, "<capability>")` (auth + rate-limit + capability).
- Mutations go through `src/server/modules/<domain>/<domain>.service.ts` into the Payload Local API (with `overrideAccess: true` — capability enforcement lives at the route + collection-access layers).
- The client reads its own capabilities from `GET /api/admin/me` via `usePermissions` and gates UI off them; server checks remain authoritative.

### `api/` — app-owned endpoints

Use for things Payload doesn't own:

- `POST /api/contact`
- `POST /api/subscribe`
- `GET /api/articles` — public paginated list (filters, rate limit, ISR)
- `GET /api/search` — public search (min query length, stricter rate limit)
- Cron: `/api/cron/sitemap`
- `GET /api/health`

App-owned list routes take precedence over Payload's catch-all for exact `/api/articles` paths. Admin CRUD stays on Payload REST.

---

## Module conventions

Each module follows the same internal shape:

```
modules/<name>/
├── pages/<PageName>/
│   ├── <PageName>.tsx
│   └── index.ts
├── components/          # Only used inside this module
├── hooks/
└── README.md            # What belongs here
```

### Which module?

| Module | Put here |
|--------|----------|
| `editorial` | Homepage, articles, archive, category/tag pages, search, ArticleCard |
| `marketing` | About, contact form, subscribe form |
| `system` | Offline page, connection banner, error boundaries |
| `shared` | SiteLayout, buttons, chips, KiribePaginationControls, empty states |

When a component is used by **two or more modules**, move it to `shared/`.

---

## Data access patterns

### Server Components (preferred for public pages)

```tsx
import { getPayloadClient } from "@/lib/payload/get-payload";

const payload = await getPayloadClient();
const { docs } = await payload.find({
  collection: "articles",
  where: { status: { equals: "published" } },
});
```

### Client interactivity

- `src/services/*.service.ts` — endpoint paths
- `src/utils/client.ts` + React Query hooks (`useQueryService`, `useInfiniteQueryService`)
- URL list state hooks in `src/utils/hooks/` — sync `page`, `q`, `view`, `filter` to query string
- `useArticlesList` in `modules/editorial/hooks/` composes hooks for archive/search/category/tag pages
- Prefer server fetch for SEO pages (article detail); client fetch for interactive lists and search

---

## Adding a new public page (checklist)

1. Add path to `src/routes/public.routes.ts`
2. Create page in `src/modules/<module>/pages/<Name>/`
3. Add thin route at `src/app/(site)/<path>/page.tsx`
4. Add nav link in `SiteLayout` if top-level
5. Update `docs/USER-FLOW.md` if user-facing

---

## Adding a new CMS collection (checklist)

1. Create `src/payload/collections/<Name>.ts`
2. Export from `src/payload/collections/index.ts`
3. Register in `src/payload.config.ts`
4. Run `npm run generate:types`
5. Add access rules in `src/payload/access/`
6. Wire public UI in the matching `modules/` folder

---

## What we deliberately avoid

- **No business logic in `app/`** — keeps routing grep-simple
- **No CMS fields in `modules/`** — schema stays in `payload/`
- **Custom admin is primary** — editors use `src/app/admin/` and `/api/admin/*`; Payload Studio is dev/emergency only when `DISABLE_PAYLOAD_STUDIO=false`
- **No custom middleware for CMS auth** — Payload sessions handle it
- **No deep nesting** — max `modules/<area>/pages/<Page>/` then flat components

---

## Environment-driven behavior

| Env set | Behavior |
|---------|----------|
| `DATABASE_URL` | Postgres via Payload |
| `R2_*` | Media uploads go to Cloudflare R2 |
| Neither | Dev still runs; CMS needs DB before admin works |

Check: `GET /api/health`

---

## Related docs

- [DEVELOPER.md](./DEVELOPER.md) — setup and commands
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) — phase checklist
- [DESIGN.md](./DESIGN.md) — visual system

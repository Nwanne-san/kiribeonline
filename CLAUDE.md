# CLAUDE.md — Kiribe Online

Guidance for AI agents working in this repository. Mirror: `cursor.md`.

## Repository overview

Kiribe Online is a premium editorial website (Next.js 15 + Payload CMS + Neon + R2). Public readers browse articles; one admin manages content.

**Read first:**
- `docs/DEVELOPER.md` — stack, setup, architecture
- `docs/DESIGN.md` — brand, typography, layout
- `docs/IMPLEMENTATION.md` — phased checklist
- `docs/USER-FLOW.md` — stakeholder journeys

## Commands

```bash
npm run dev        # localhost:3000
npm run build
npm run lint
npm run typecheck
```

## Architecture

**Read `docs/ARCHITECTURE.md` first** — it defines the three layers (routes / modules / platform) and where new code goes.

### Routing (App Router)

```
src/app/
├── layout.tsx, providers.tsx   # Root shell (+ GA4 when env set)
├── (site)/                     # Public website → SiteLayout
├── admin/                      # Custom Kiribe admin — primary editor UX
├── (payload)/                  # Payload CMS — do not edit generated files
└── api/                        # App-owned endpoints (contact, health, cron, admin, analytics)
```

**Do not send editors to Payload Studio.** Day-to-day work is the custom admin at `/admin/*`. Set `DISABLE_PAYLOAD_STUDIO=true` in production.

**Rule:** Route files stay thin. Page logic lives in `src/modules/<domain>/pages/`.

### Module system

```
src/modules/
├── editorial/     # Homepage, articles, archive, categories, search
├── admin/         # Custom Kiribe admin (dashboard, article editor, homepage builder, …)
├── marketing/     # About, contact, subscribe
├── system/        # Offline, error states
└── shared/        # SiteLayout, shared UI, types
```

Each module: `pages/`, `components/`, `hooks/` — see module README.md files.

### CMS layer

```
src/payload/       # Collections, globals, access, fields
src/payload.config.ts
src/lib/payload/   # getPayloadClient()
```

### API layer

- **Server domain logic lives in `src/server/`** (BrandDrive-style domain co-location): `src/server/modules/<domain>/` holds `<domain>.service.ts` + `.dto.ts` + `.types.ts` + `.access.ts`; auth guards + capability model live in `src/server/auth/` and `src/server/access/roles.ts`. Thin route handlers in `src/app/api/admin/<domain>/route.ts` import from `@/server/*`. See `docs/ARCHITECTURE.md`.
- `src/utils/client.ts` — Axios singleton, cookie auth
- `src/services/*.service.ts` — client endpoint configs (add as API grows)
- TanStack Query: `useQueryService`, `useInfiniteQueryService`, `useMutationService`
- URL list state: `usePagination`, `useFilter`, `useDebouncedUrlParam`, `useListViewMode`, `useModalRoute`
- App constants: `src/constants/app.constants.ts` — page limits, debounce, cache defaults (never hardcode in components)

### Route enums

Always use `PublicRoutes` and `AdminRoutes` from `src/routes/`. No hardcoded path strings in components.

### Styling

We're migrating from MUI 7 → Tailwind v4 (Branddrive-web style). Keep MUI primitives; put styles in `className`, not `sx`.

- **Design tokens live in `src/theme/tailwind.css`** under `@theme` (Tailwind v4 CSS-first config). Brand colors, fonts, spacing, breakpoints, shadows, radii are all defined there as CSS custom properties.
- **New / migrated components**: MUI `Box`/`Typography`/`Button`/etc. stay; layout and visual styles go in Tailwind `className` + tokens (`bg-burgundy`, `text-mustard`, `font-headline`). Use `cn()` from `@/modules/shared/components/tw`.
- **Do not add new `sx` for layout, spacing, color, typography, border, or shadow.** Escape hatches only: runtime colors via `style`, or MUI deep slots via `slotProps` + `className` (tiny `sx` as last resort). See `docs/DESIGN.md` §14 mapping table.
- **Existing MUI theme** (`src/theme/muiTheme.ts`) stays in sync with tokens for unmigrated defaults. Don't add new MUI primitives if you can avoid them.
- **Kiribe wrappers** (`KiribeTypography`, `KiribeButton`, `EditorialContainer`, `EditorialSection`, `KiribeTextField`, `KiribeLink`) are the seam — Tailwind-backed defaults; keep public APIs stable.
- **Admin:** prefer `AdminPrimitives` + Tailwind only.
- Reusable layout shortcuts in `src/theme/tailwind.css`: `editorial-container`, `editorial-section`, `kiribe-field`, `kicker`, `gold-rule`, `line-clamp-2`, `line-clamp-3`.
- Icons: continue using `@mui/icons-material` for now; size via `fontSize` or `className`, not `sx`.

**Do not** introduce a new component library (no shadcn/Radix/Headless UI install yet — confirm first if needed).

## Development workflow

1. **Requirements** — PRD/TRD + design doc
2. **Architecture** — invoke `software-architect` (`subagent_type: software-architect`) for non-trivial features
3. **Implementation** — invoke `software-developer` (`subagent_type: software-developer`)
4. **Review** — invoke `code-reviewer` (`subagent_type: code-reviewer`) — mandatory for auth, forms, uploads, list APIs
5. **QA** — invoke `qa-expert` (`subagent_type: qa-expert`) or manual test plan
6. **Update docs** — `IMPLEMENTATION.md` checkboxes, `DEVELOPER.md` if architecture changes

### Feedback loops

- Developer must run `code-reviewer` before marking work complete
- Fix all CRITICAL and HIGH review findings before QA
- If QA finds regressions, return to developer → reviewer → QA
- Cursor Task tool maps 1:1 to agent roles above; user skills `review-security` / `review-bugbot` are optional spot checks, not replacements for `code-reviewer`

### Git & release flow

See `docs/GIT-WORKFLOW.md` (authoritative). Short version: `feat/<slug>` from
`develop` → squash PR into `develop` → promotion PR `develop → staging` (merge
commit) → release PR `staging → main`. Commits: `type(scope): imperative subject`
with a wrapped body on real features. Preflight before every PR: lint,
typecheck, build, diff sweep. CI runs on all three long-lived branches; Vercel
deploys via Git integration (production = `main`).

## Code hygiene

1. Match existing patterns before inventing new ones
2. No `any` unless unavoidable — document why
3. No secrets in code or commits
4. Server-side auth checks for all admin mutations (even with middleware)
5. Rate-limit public write endpoints (contact, subscribe, login) **and public read list endpoints** (`/api/articles`, `/api/search`)
6. Images: alt text required; use Next.js Image + R2 patterns
7. SEO: metadata on every public route
8. i18n: English only in v1

## Anti-patterns to reject

- Business logic in `src/app/**/page.tsx` beyond imports
- Hardcoded routes instead of route enums
- Client-only auth checks without server validation
- Fetching in components when a service + React Query hook exists
- Hardcoded page limits or debounce delays (use `@/constants`)
- List state in React `useState` when it should sync to URL (`page`, `q`, `view`, `filter`)
- Inline styles when Tailwind tokens exist
- Committing `.env` or Figma tokens

## Figma workflow

File key: `iBC8YfVwanBDq1nh1VTS9f`

1. Use Figma MCP (`get_figma_data`) before building new UI sections
2. Update `docs/DESIGN.md` when tokens change
3. Export assets to `public/` or R2 — not hotlinked from Figma in production

## Agent memory

Project memory lives in `.claude/agent-memory/<role>/`. Keep `MEMORY.md` under 200 lines; use topic files for detail.

## Key file paths

| Concern | Path |
|---------|------|
| Architecture rules | `docs/ARCHITECTURE.md` |
| Payload config | `src/payload.config.ts` |
| Server domain logic | `src/server/modules/<domain>/` |
| Capability model | `src/server/access/roles.ts` |
| Auth guards / session | `src/server/auth/` |
| Auth hardening plan | `docs/AUTH-HARDENING.md` |
| getPayload | `src/lib/payload/get-payload.ts` |
| HTTP client | `src/utils/client.ts` |
| Content types | `src/modules/shared/types/content.ts` |
| Design tokens | `src/theme/tailwind.css` |
| Public routes | `src/routes/public.routes.ts` |
| Admin routes | `src/routes/admin.routes.ts` |
| App constants | `src/constants/app.constants.ts` |
| List content queries | `src/lib/content/` |
| URL list hooks | `src/utils/hooks/usePagination.ts`, `useFilter.ts`, `useDebouncedUrlParam.ts` |

## Stack constraints (v1)

- Payload CMS for admin — do not build a parallel CMS
- Neon PostgreSQL — relational content model
- Cloudflare R2 — media storage
- Redis optional — site must work without it

## Out of scope (v1)

Separate Film/TV/Videos sections, comments, paywall, native app, i18n, personalization.

> **Multi-admin is now in scope.** The team uses role-based access (admin / editor
> / writer / contributor) enforced by a capability map in `src/server/access/roles.ts`.
> Every admin mutation guards a capability server-side (`requireAdminWriteCapability`),
> and the client reads its own capabilities from `/api/admin/me` via `usePermissions`.

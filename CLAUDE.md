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

- `src/utils/client.ts` — Axios singleton, cookie auth
- `src/services/*.service.ts` — endpoint configs (add as API grows)
- TanStack Query: `useQueryService`, `useInfiniteQueryService`, `useMutationService`
- URL list state: `usePagination`, `useFilter`, `useDebouncedUrlParam`, `useListViewMode`, `useModalRoute`
- App constants: `src/constants/app.constants.ts` — page limits, debounce, cache defaults (never hardcode in components)

### Route enums

Always use `PublicRoutes` and `AdminRoutes` from `src/routes/`. No hardcoded path strings in components.

### Styling

We're migrating from MUI 7 → Tailwind v4 + headless primitives. Both stacks coexist during the migration.

- **Design tokens live in `src/theme/tailwind.css`** under `@theme` (Tailwind v4 CSS-first config). Brand colors, fonts, spacing, breakpoints, shadows, radii are all defined there as CSS custom properties.
- **New components**: prefer Tailwind utilities + small headless primitives. Tokens are accessed via class names (`bg-burgundy`, `text-mustard`, `font-headline`) or `var(--color-burgundy)`.
- **Existing MUI components stay** until rewritten — they consume the same tokens via `src/theme/muiTheme.ts` so colors stay in sync. Don't add new MUI primitives if you can avoid them.
- **Kiribe wrappers** (`KiribeTypography`, `KiribeButton`, `EditorialContainer`, `EditorialSection`, `KiribeTextField`, `KiribeLink`) are the seam for the migration. When rewriting them in Tailwind, keep their API identical so callers don't change.
- Reusable layout shortcuts in `src/theme/tailwind.css`: `editorial-container`, `editorial-section`, `kicker`, `gold-rule`, `line-clamp-2`, `line-clamp-3`.
- Icons: continue using `@mui/icons-material` for now; we'll swap to `lucide-react` when convenient.

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

Separate Film/TV/Videos sections, multi-admin, comments, paywall, native app, i18n, personalization.

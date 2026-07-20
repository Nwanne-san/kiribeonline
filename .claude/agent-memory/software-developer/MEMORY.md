# Software developer memory — Kiribe Online

## Conventions

- Path alias: `@/*` → `src/*`
- Page pattern: `src/app/.../page.tsx` imports from `src/modules/.../pages/`
- Styling: Tailwind + `cn()` helper
- Fonts: Outfit (headlines), Open Sans (body)

## Key files

| File | Purpose |
|------|---------|
| `middleware.ts` | Admin cookie gate |
| `src/utils/client.ts` | Axios + cookie auth |
| `src/utils/helper.ts` | cn, buildQuery, slugify, dates |
| `src/theme/tailwind.css` | Brand tokens |

## Phase status

- Foundation scaffold complete
- Payload CMS not yet installed — next major task

## Gotchas

- `middleware.ts` uses `@/routes/admin.routes` — keep enum in sync with app folder structure
- Offline page is `"use client"` for retry button
- Do not commit Figma tokens — use MCP env or `.env.local`
- [Admin list URL params & server filtering](gotcha_admin_list_url_params.md) — URL_PARAMS is a fixed enum; do list filtering server-side, not per-page client-side
- [Illustrations & error-boundary traps](gotcha_illustrations_error_boundaries.md) — brand-color SVGs vanish on colored bars; global-error has no CSS vars/globals
- [useMutationService data type](gotcha_mutation_service_data_type.md) — function-form `data` is typed as full Req; omit it and let variables be the body
- [next-svgr breaks metadata icons](gotcha_svgr_metadata_icons.md) — app-dir icon.svg needs a webpack resourceQuery exclusion in next.config.ts
- [SEO/OG metadata gotchas](gotcha_seo_og_metadata.md) — opengraph-image.tsx overrides generateMetadata images; DB-reading sitemap must be force-dynamic to build without a DB
- [Unsaved-changes guard redirect trap](gotcha_unsaved_changes_guard_redirect.md) — a monkey-patched router.push nav guard will prompt on the caller's own post-save redirect until React re-renders; expose a navigateSafely bypass

## Testing

- [Playwright smoke pattern](playwright-smoke-pattern.md) — E2E lives in `e2e/`, globalSetup shells out to migrate+seed, seed reuses existing scripts + Payload local API, admin users need `role: "admin", status: "active"`

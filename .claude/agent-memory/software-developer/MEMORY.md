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
- [Illustrations & error-boundary traps](gotcha_illustrations_error_boundaries.md) — brand-color SVGs vanish on colored bars; global-error has no CSS vars/globals
- [next-svgr breaks metadata icons](gotcha_svgr_metadata_icons.md) — app-dir icon.svg needs a webpack resourceQuery exclusion in next.config.ts

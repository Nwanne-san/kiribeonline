# Code reviewer memory — Kiribe Online

## Project structure

- Routes: `src/routes/public.routes.ts`, `src/routes/admin.routes.ts`
- Auth middleware: `middleware.ts` (cookie `accessToken`, `/admin/*`)
- HTTP client: `src/utils/client.ts` (js-cookie token)
- Content types: `src/modules/shared/types/content.ts`
- Design tokens: `src/theme/tailwind.css`

## Recurring review flags

- **Auth:** Middleware alone is not enough — Payload/server actions must re-verify session on mutations
- **Secrets:** Never in client components or `NEXT_PUBLIC_*` except truly public values
- **Forms:** Contact/subscribe need rate limiting + server validation
- **Uploads:** Validate MIME, size, extension before R2
- **XSS:** Sanitize rich text from Payload before render
- **Routes:** Flag hardcoded `/articles` strings — use `PublicRoutes`

## Topic files

- [security-review.md](./security-review.md) — OWASP checklist for this stack
- [payload-patterns.md](./payload-patterns.md) — CMS integration notes (fill as Phase 1 progresses)

---
name: playwright-smoke-pattern
description: Kiribé's Playwright smoke pattern — globalSetup runs migrate+seed via subprocess, seed reuses existing scripts + Payload local API, spec fixtures live in e2e/fixtures/constants.ts
metadata:
  type: project
---

# Playwright smoke suite pattern

E2E lives in `e2e/` at the repo root (not `src/`) so it stays out of the Next build. Config: `playwright.config.ts`, testMatch `.spec.ts`, single chromium project, `webServer` runs `npm run build && npm run start`, `reuseExistingServer` locally only.

**Why:** the Payload admin uses cookie auth and dynamic routes, so we need a real server. A pure jsdom setup can't exercise SSR + admin auth cookies + FormData uploads.

**How to apply:**
- Playwright globalSetup shells out (`spawnSync npm run migrate`, then `npx tsx e2e/seed.ts`) so migration + seed are the same commands as CI/local dev — one source of truth.
- The seed script (`e2e/seed.ts`) *reuses* `scripts/seed-taxonomy.mjs` by shelling out; it only writes smoke-specific fixtures (admin user + smoke category + smoke article) directly through Payload's local API.
- Users get created with `role: "admin", status: "active"` — anything else fails the login route's status check.
- Shared constants (admin email/password, smoke article slug/title/body) live in `e2e/fixtures/constants.ts` so specs and seed stay in agreement.
- Payload's generated create-DTO type is strict; seed data literals need `as never` (or `as unknown as Record<string, unknown>` for the runtime-only fields like `role`/`status` that aren't on the generated Create DTO surface).
- For UI tests, prefer `getByLabel(...)` / `getByRole(...)` over CSS selectors — resilient to MUI→Tailwind churn.
- For the article editor (Lexical rich text): drive Title through the UI to prove the form mounts, then do create+publish via `/api/admin/articles` REST. Full Lexical form input is too brittle for smoke.
- Media upload: `page.request.post` with `multipart: { file: { name, mimeType, buffer } }` hits `/api/admin/media` directly with the admin session cookie already on `page.request`.
- CI: separate job `needs: verify` so smoke flakes don't block merges. Upload `playwright-report/` on failure with `actions/upload-artifact@v4`.
- `PLAYWRIGHT_SKIP_SEED=1` disables globalSetup for config-only checks (`playwright test --list`).

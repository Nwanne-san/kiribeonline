---
name: gotcha-admin-list-url-params
description: Admin list screens — URL_PARAMS is a fixed enum (page/limit/q/view/filter/modal); the admin articles API filters server-side
metadata:
  type: feedback
---

Building admin editorial list screens (e.g. `ArticlesListPage`): two things that aren't obvious from a first read.

- `@/constants` `URL_PARAMS` only defines `page/limit/q/view/filter/modal`, and `app.constants.ts` is on the do-not-edit list. Screen-specific list params (status, category, author, sort) must be declared as a small local `PARAM` const in the page — don't reach for `URL_PARAMS.status`, it doesn't exist and won't typecheck.

- **Why:** the shared constant is deliberately generic; per-screen filters live with the screen.
- **How to apply:** use `usePagination` (page/limit) + `useDebouncedUrlParam` (q) for the shared params, and a single local `updateParams(updates)` helper (read `window.location.search` live, not the render snapshot, to avoid clobbering the debounced-search writer) for the screen-specific ones.

- Do filtering/sorting **server-side**, not client-side over the current page. Client-side refine of one fetched page silently hides matches on other pages and desyncs the pager totals (a HIGH review finding). The admin articles service (`src/server/modules/articles/articles.service.ts`) now accepts `categoryId` (relationship membership `equals`), `authorId`, and `sort` ("newest"/"oldest" → publishedAt order); default sort stays `-updatedAt` when `sort` is omitted so the dashboard's scheduled query is unaffected.

# Codebase Review — 2026-07-04

Full-codebase audit across five tracks: project status, image upload/handling, rate
limiting, embeds/rich content, and UI feedback states. Each track has a companion
implementation draft in `docs/plans/`.

## Where the project stands

Phase 1 (Foundation) and Phase 2 (Core) are largely done: custom admin, article CRUD,
homepage builder, media library, public pages, search, ISR caching. Phase 3
(Resilience) is partial — basic in-app rate limiting exists, offline is entirely
pending. Phase 4 (Optimization) is untouched. The TRD §13 security checklist is
entirely unchecked.

**Blocking foundation gaps (from `docs/IMPLEMENTATION.md`):**

- Neon PostgreSQL provision + first migrate
- `.env.local` wired for dev; first admin user created
- Figma MCP connection + token confirmation in `src/theme/tailwind.css`

**Doc inconsistencies to fix while updating checklists:**

- Sitemap: §2.3 "Sitemap generation" unchecked, but §3.4 sitemap cron is checked.
- Security checklist duplicates items already marked done in §1.3/§3.2 (audit hooks,
  contact/subscribe limits) — reconcile.
- `docs/DEVELOPER.md` env table lists `NEXT_PUBLIC_GA_MEASUREMENT_ID` twice.

---

## Track 1 — Image upload & handling · `docs/plans/PLAN-IMAGES.md`

**What's good:** alt text is enforced at three layers (Media collection, POST route,
MediaPicker UI) and `KiribeImage` requires `alt` at the type level. MIME whitelist
exists. `sharp` is registered. R2 adapter is wired. All admin upload/delete endpoints
are auth-guarded.

**Findings (prioritized):**

| # | Severity | Finding |
|---|----------|---------|
| I1 | HIGH | No `imageSizes` on the Media collection (`src/payload/collections/Media.ts:17-20`) — zero responsive variants; every consumer ships the full-resolution original. |
| I2 | HIGH | Article body images render as plain `<img>` via `RichTextRenderer` — they bypass `next/image` entirely (no resizing, lazy-loading, or format conversion). |
| I3 | HIGH | No file-size limit anywhere — collection, `POST /api/admin/media`, or MediaPicker. Uploads are unbounded. |
| I4 | MED | No blur/LQIP placeholders (`placeholder="blur"` unused repo-wide) — images pop in, no premium loading feel. |
| I5 | MED | `next.config.ts` images: `R2_PUBLIC_URL` custom-domain host missing from `remotePatterns` (optimization will break on a custom CDN domain); no `formats`, `deviceSizes`, or `minimumCacheTTL`; `*.cloudflare.com` wildcard is overly broad. |
| I6 | MED | No server-side format/dimension normalization (`formatOptions`/`resizeOptions`) and no client-side downscale before upload. |
| I7 | LOW | `focalPoint` not enabled despite DB columns existing; no crop UI. |
| I8 | LOW | `DELETE /api/admin/media/[id]` ignores `usageCount` — can orphan images still referenced by articles. |
| I9 | LOW | Silent fallback to local disk when R2 env is missing; broken URLs if `R2_PUBLIC_URL` unset. Fail loudly in production. |

## Track 2 — Rate limiting · `docs/plans/PLAN-RATE-LIMITING.md`

**What's good:** a consistent `rateLimitForEndpoint()` helper covers contact,
subscribe, articles, categories, search, analytics-view, and admin login. All admin
mutation routes verify the Payload session server-side (full coverage confirmed).

**Findings (prioritized):**

| # | Severity | Finding |
|---|----------|---------|
| R1 | HIGH | The limiter is an in-memory `Map` (`src/lib/rate-limit.ts:6`) — per-instance and non-persistent. On Vercel/serverless it is effectively decorative. No Redis code path exists despite `REDIS_URL` being documented. |
| R2 | HIGH | Client IP comes from `x-forwarded-for` verbatim (`src/lib/auth/client-ip.ts:3-9`) — spoofable; all "unknown" IPs share one bucket. |
| R3 | HIGH | `GET /api/subscribe/confirm` has no rate limit — token brute-force surface. |
| R4 | MED | Payload's own REST catch-all + GraphQL routes (`src/app/(payload)/api/[...slug]`) are a public surface with no custom rate limiting. |
| R5 | MED | Admin write actions have no rate limit (IMPLEMENTATION §3.2 pending item). |
| R6 | LOW | Window inconsistency: contact/subscribe silently use the 15-min default window while everything else passes 1 min — make explicit. |
| R7 | LOW | Login limit (10/min/IP, in-memory) is loose for a credential endpoint; no lockout/backoff. |

## Track 3 — Embeds & rich content · `docs/plans/PLAN-EMBEDS.md`

**What's good:** a hand-rolled Lexical editor (`AdminRichTextEditor`) with a solid
formatting toolbar and Media-library image insertion; a proven, sanitized embed
parser already exists for Reels (`src/lib/reels/parse-embed.ts` — YouTube, Instagram,
TikTok, host allow-list, click-to-activate iframes).

**Findings (prioritized):**

| # | Severity | Finding |
|---|----------|---------|
| E1 | HIGH | Article bodies support **zero embeds** — no video, social, gallery, or pull-quote blocks. The Reels embed machinery is not reachable from the article editor. |
| E2 | HIGH | `article.seo.ogImage` is stored and editable but **never rendered** — `src/app/(site)/articles/[slug]/page.tsx:10-20` emits only title/description. No `openGraph`/`twitter` metadata, no `metadataBase`, no dynamic OG image. Shared links have no preview image. |
| E3 | MED | Link dialog accepts any string as href (`AdminRichTextEditor.tsx:676-717`) — no scheme allow-list; `javascript:` URLs are accepted. |
| E4 | MED | `RichTextRenderer` uses only default converters — any new custom node will silently not render publicly until converters are added. |
| E5 | LOW | Custom admin editor registers a subset of Lexical nodes; content created elsewhere (Payload Studio) may fail to load in it. |

## Track 4 — UI states & illustrations · `docs/plans/PLAN-ILLUSTRATIONS-STATES.md`

**What's good:** homepage `loading.tsx` skeleton is thorough and brand-styled; a
skeleton component library exists; `OfflinePage` is designed; `KiribeSnackbar` covers
toasts; `GlobalEmptyState` already has an (unused) `image` slot for illustrations.

**Findings (prioritized):**

| # | Severity | Finding |
|---|----------|---------|
| U1 | HIGH | No `error.tsx`, `global-error.tsx`, or `not-found.tsx` anywhere in `src/app` — crashes and 404s fall back to unstyled Next.js defaults. `notFound()` is called on article pages with nothing to catch it. |
| U2 | HIGH | The offline page is unreachable: no `navigator.onLine` detection, no service worker, no offline banner (all of IMPLEMENTATION §3.3 pending). |
| U3 | MED | Empty states are plain text; three inconsistent implementations (`tw/EmptyState`, `GlobalEmptyState`, `DataRenderer` default). No illustrations anywhere. |
| U4 | MED | `DataRenderer` default loading is a generic MUI spinner — violates DESIGN §9 ("no spinners for article lists"). |
| U5 | LOW | Motion system is nearly empty: one easing token, one `fadeIn` keyframe. No shimmer, no stagger, no duration scale. |

## Track 5 — Logo loader & premium polish · `docs/plans/PLAN-LOGO-LOADER.md`

**Findings:**

| # | Severity | Finding |
|---|----------|---------|
| L1 | HIGH | The only logo asset is `public/brand/kiribe-logo.png` (4375×2730 raster). No SVG, no favicon set, no mark-only variant. An SVG is a prerequisite for a real logo animation — and already an open item in DESIGN §15. |
| L2 | MED | No route-transition loading indicator; only the homepage has a route-level `loading.tsx`. |
| L3 | LOW | Header logo scales a 4375px PNG down to 40px — wasteful and soft on high-DPI. |

---

## Recommended implementation order

1. **Security/correctness first (small, high leverage):** R3 + R6 + E3 same day;
   R1/R2 (durable rate limiting + trusted IP) next — see PLAN-RATE-LIMITING.
2. **Images pipeline (I1–I6):** unblocks performance and the premium feel everywhere
   images appear — see PLAN-IMAGES.
3. **Error/404/offline + illustrations (U1–U3):** highest visible-quality win per
   effort — see PLAN-ILLUSTRATIONS-STATES.
4. **Logo SVG + loader + motion tokens (L1–L3, U4–U5):** see PLAN-LOGO-LOADER.
5. **Embeds + OG metadata (E1–E2):** biggest editorial capability gain — see
   PLAN-EMBEDS. (E2 can ship earlier; it's a small standalone fix.)

Workflow per CLAUDE.md: each plan goes `software-architect` (already drafted here) →
`software-developer` → `code-reviewer` (mandatory: uploads, list APIs, auth touched) →
`qa-expert` → update `docs/IMPLEMENTATION.md`.

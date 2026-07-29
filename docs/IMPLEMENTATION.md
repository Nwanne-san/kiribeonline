# Kiribe Online — Implementation Plan

Derived from PRD v1.0 and TRD v2.2. Use this as the master build checklist.

---

## Phase 1: Foundation

### 1.1 Repository and tooling
- [x] Next.js 15 + TypeScript scaffold
- [x] Tailwind 4 + brand fonts (Outfit, Open Sans)
- [x] Route enums, HTTP client, middleware pattern
- [x] Agent docs (`.claude/`, `CLAUDE.md`)
- [x] Design doc scaffold (`docs/DESIGN.md`)
- [x] Payload CMS install and config
- [x] Payload collections scaffold (Articles, Categories, Tags, Media, Users, AuditLogs)
- [x] Site Settings global
- [x] Scalable folder structure (`docs/ARCHITECTURE.md`)
- [x] R2 storage adapter (env-gated in payload.config.ts)
- [ ] Neon PostgreSQL provision + first migrate
- [ ] `.env.local` wired for dev

### 1.3 Auth (TRD §9)
- [x] Custom Kiribe admin at `/admin/*` (Payload session, not Payload Studio UX)
- [x] `POST /api/admin/auth/login` + session guard on admin routes
- [x] `scripts/create-admin.mjs` bootstrap script
- [x] `DISABLE_PAYLOAD_STUDIO=true` in production
- [ ] Create first admin user (run script per environment)
- [x] Audit log hooks on mutations

### 1.4 Design parity
- [ ] Figma MCP connected with file access
- [ ] Color/spacing tokens confirmed in `src/theme/tailwind.css`
- [x] Shared layout components (`SiteHeader`, `SiteFooter`)
- [ ] MUI `sx` → Tailwind `className` migration — **reverted 2026-07-29.** A
      bulk sweep across ~88 components regressed visual parity with Figma
      (buttons, text fields, textareas, and type scale all drifted). Redo
      component-by-component against the Figma node specs, verifying each
      screen before moving on. Snapshot of the reverted sweep:
      branch `wip/tailwind-sweep-snapshot`.

---

## Phase 2: Core product

### 2.1 Public pages
- [x] Homepage — hero, Editor's Picks, category modules from CMS
- [x] Article detail — hero, body, optional image modal (`/articles/[slug]`)
- [x] All Articles — search, list/grid/feed toggle, pagination, URL state
- [x] Category archive (`/categories/[slug]`)
- [x] Tag archive (`/tags/[slug]`)
- [x] About (+ contact section)
- [x] Contact form + validation
- [x] Subscribe form
- [x] Privacy Policy, Terms of Use
- [x] Search results page (`/search?q=`)

### 2.2 Admin workflow
- [x] Article CRUD + schedule/publish (custom admin UI + `/api/admin/articles`)
- [x] Category/tag management
- [x] Media library
- [x] Homepage builder + Editor's Picks + per-category layout
- [x] Site settings editor (site name, logo, SEO defaults, social links)
- [x] Analytics (viewCount tables + GA4 link)
- [x] Audit log viewer (filters, pagination, metadata expand — `audit:view` capability)
- [x] Editorial Calendar (`/admin/calendar` — scheduled articles month grid)
- [x] SEO hub (`/admin/seo` — defaults + top articles; homepage deep-link)
- [x] Pages CMS (`/admin/pages` — full CRUD on the `pages` collection; rich-text
      body, SEO group, draft/published; renders publicly at `/<slug>`)
- [x] Navigation & Footer (`/admin/navigation` — header links + footer columns
      persisted on the `site-settings` global; falls back to category-derived
      defaults until an admin saves)
- [x] Header nav capped at 6 category links (`NAV_MAX_HEADER_LINKS`) — enforced
      in the Payload array (`maxRows`), the PATCH schema, and the header resolver
- [x] Admin design system matches the public site — burgundy/mustard/cream (the
      Figma Make CMS red `#7F0400` + amber `#E6A313` were dropped), square edges
      everywhere, and `AdminButton` padding/type identical to the public
      `MuiButton` theme

### 2.3 Content delivery
- [x] Server-rendered article detail pages
- [ ] Related content module
- [x] Basic search (Payload `contains` on title/excerpt)
- [x] Sitemap generation (public `/sitemap.xml` + auth-gated cron variant)

---

## Phase 3: Resilience

### 3.1 Caching (TRD §11)
- [x] ISR/revalidation for public list APIs (`LIST_REVALIDATE_SECONDS`, `revalidateTag('articles')`)
- [x] Homepage and category cache strategy (`revalidateTag('homepage')`)
- [ ] Optional Redis for hot paths

### 3.2 Rate limiting (TRD §11.2)
- [x] Login endpoint (5/15 min per IP + 10/hour per email)
- [x] Contact form (IP limit, Redis-backed w/ in-memory fallback)
- [x] Subscribe form (IP limit) + confirm-token endpoint (10/15 min)
- [x] Article/search list reads (IP limit)
- [x] Admin write actions (60/min per user via `requireAdminWrite`)
- [ ] Cloudflare edge rules where applicable (documented in `docs/DEPLOYMENT.md`; apply when zone is set up)

### 3.3 Offline (TRD §12)
- [ ] Service worker / PWA shell — **deferred for v1, see `docs/DECISIONS.md`**
- [ ] Cache critical assets + selected articles — deferred with the SW
- [x] Global offline banner (`OfflineBanner` + `useOnlineStatus`, mounted in `SiteLayout`)
- [x] `/offline` fallback page (branded, `OfflineAntennaIllustration`)
- [ ] Queue or graceful fail for write actions

### 3.4 Background jobs (TRD §11.3)
- [x] Sitemap cron (`/api/cron/sitemap`)
- [x] Scheduled publishing stub (`/api/cron/publish-scheduled`)
- [ ] Cache cleanup
- [ ] Log rotation

---

## Phase 4: Optimization

- [x] SEO metadata on all public routes (openGraph/twitter + 3-tier OG image + robots)
- [ ] Analytics (GA or equivalent)
- [x] Image optimization pipeline (variants, WebP, LQIP blur-up, body images via next/image)
- [ ] Lighthouse performance pass
- [ ] Backup/restore runbook tested on Neon
- [x] Monitoring and logging baseline (Sentry Next.js SDK — client + server + edge, no-op without DSN, expected 4xx filtered out)

---

## Security checklist (TRD §13)

- [ ] Strong password policy
- [ ] Session expiration
- [x] CSRF on applicable forms (Origin/Referer allowlist via `assertSameOrigin`, wired into admin write path + public forms + auth routes; `CSRF_ALLOWED_ORIGINS` env, fails closed)
- [x] Rate limiting on auth and public writes (login IP+email dimensions, contact, subscribe, confirm-token, admin writes; Redis-backed when `REDIS_URL` set)
- [x] Secure file upload validation (size cap pre-buffer, MIME allowlist + magic bytes, pixel-decode cap, capability-gated)
- [x] Env vars never in client bundle (verified in code reviews of PRs #3/#15/#16)
- [x] Audit logging on admin mutations (+ auth events: login, lockout, invites)

See `.claude/agent-memory/code-reviewer/security-review.md`.

---

## Acceptance criteria (TRD §15)

1. Admin manages all content from one place
2. Public site matches approved brand system
3. Content is easy to browse and discover
4. Auth is secure
5. Caching and offline work as specified
6. Backups documented and tested
7. Production deployment ready

---

## Development workflow

1. Requirements — PRD/TRD + `docs/DESIGN.md`
2. Architecture — `software-architect` agent
3. Implementation — `software-developer` agent
4. Review — `code-reviewer` agent
5. QA — manual + automated as added
6. Document — update this file and `DEVELOPER.md`

---

## Out of scope (v1)

- Separate Film/TV/Videos/News/Opinion/Spotlight/Events top-level pages
- Multi-role CMS
- Comments
- Paywall / subscription billing
- Native app
- Multi-language
- Advanced personalization

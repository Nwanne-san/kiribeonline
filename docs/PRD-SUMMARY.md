# Kiribe Online — PRD summary

Full document: client PDF (June 2026, v1.0).

## Vision

Premium editorial and entertainment platform — film, TV, video, opinion, news, spotlight — in a magazine-style format. Simple for one admin to run; affordable in year one.

## In scope (v1)

- Homepage with featured stories
- All-articles archive
- Article detail pages
- Category and tag browsing
- About, Contact, Subscribe
- Single-admin CMS
- Media upload
- SEO, analytics, caching, offline UX
- Dev, staging, production environments

## Out of scope (v1)

Separate Film/TV/Videos/News/Opinion/Spotlight/Events pages, multi-admin, comments, paywall, native app, i18n, personalization.

## Stack

Next.js, Payload CMS, Neon PostgreSQL, Cloudflare R2, Cloudflare edge.

## Phases

1. Foundation — design system, envs, CMS, DB, storage
2. Core — homepage, articles, archive, admin
3. Resilience — cache, rate limit, offline
4. Optimization — SEO, analytics, performance

## Success metrics

- Admin manages content from one place
- Site feels premium and editorial
- Smooth mobile browsing
- Traffic spike handling
- Useful offline experience
- Affordable launch, scalable later

See [IMPLEMENTATION.md](./IMPLEMENTATION.md) for the build checklist.

# Software architect memory — Kiribe Online

## Stack decisions (from TRD)

- Next.js 15 App Router + TypeScript
- Payload CMS (admin + content API)
- Neon PostgreSQL
- Cloudflare R2 (zero egress for media)
- Optional Redis later — not required for v1

## v1 scope boundary

Single admin, no comments, no paywall, no separate Film/TV top-level pages.

## IA (primary nav)

Home, Articles, Categories, About, Contact, Subscribe

## Data model summary

See `src/modules/shared/types/content.ts` and TRD §10.

## Open architecture items

- [ ] Payload + Next.js integration path (app router vs separate)
- [ ] ISR vs SSR per page type
- [ ] Search implementation (DB full-text vs lightweight index)
- [ ] Service worker strategy for offline

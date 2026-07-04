# Kiribe Online — TRD summary

Full document: client PDF (June 2026, v2.2).

## Brand and UX

- Premium, editorial, clean, visually rich
- 12-column centered grid
- **Outfit** headlines, **Open Sans** body
- Mustard yellow + burgundy brand colors

## Navigation

Home, Articles, Categories, About, Contact, Subscribe

Supporting: Search, category/tag archives, Privacy, Terms, Offline fallback

## Roles

| Role | Access |
|------|--------|
| Visitor | Read, browse, subscribe, contact |
| Admin | Full content and settings |
| System | Auth, cache, audit, rate limits |

## Technical architecture

| Layer | Choice |
|-------|--------|
| Frontend | Next.js, TypeScript, SSR/ISR |
| CMS | Payload CMS |
| Database | Neon PostgreSQL |
| Media | Cloudflare R2 |
| Edge | Cloudflare cache + rate limit |
| Optional | Redis for hot cache |

## Auth (§9)

Email/password login, server-side session, privileged actions verified server-side, audit logging.

## Data model (§10)

Articles, Categories, Tags, Media, Settings, Audit Logs, Cache/offline metadata.

## Performance (§11)

- ISR/caching for viral articles
- Rate limits on login, contact, subscribe, admin writes
- Essential cron jobs only
- Redis optional in v1

## Offline (§12)

Service worker, branded offline state, cached articles, retry UI, queue or fail writes gracefully.

## Security (§13)

Password policy, session expiry, CSRF, rate limits, secure uploads, env protection, audit logs.

## Acceptance (§15)

Admin manages everything; brand match; secure auth; cache/offline work; backups documented; production ready.

See [DESIGN.md](./DESIGN.md) and [IMPLEMENTATION.md](./IMPLEMENTATION.md).

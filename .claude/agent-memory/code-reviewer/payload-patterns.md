---
name: payload-patterns
description: Payload CMS integration patterns for Kiribe Online
metadata:
  type: project
---

# Payload CMS patterns (Phase 1)

## Planned integration

- Payload embedded in Next.js app directory
- Collections: Articles, Categories, Tags, Media, Settings, AuditLogs
- Admin UI at `/admin` or Payload default `/admin` — align with `AdminRoutes`

## Review flags (when implemented)

- Access control on every collection (admin-only writes, public read for published articles)
- Draft/published status enforced on public queries
- Scheduled publish via `publishedAt` + cron
- Media collection uses R2 adapter
- Hooks for audit log on create/update/delete

## Key paths (TODO after install)

- `payload.config.ts` — root or `src/`
- Collection defs — `src/payload/collections/`

Update this file when Payload is wired.

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

## Key paths

- `src/payload.config.ts` — Payload Studio at `/payload-studio`, GraphQL disabled, REST enabled
- Collection defs — `src/payload/collections/`
- Native Payload REST catch-all — `src/app/(payload)/api/[...slug]/route.ts`

## CRITICAL recurring review flag — capability model vs native REST

The custom admin API (`/api/admin/*`) enforces the capability matrix
(`src/payload/access/roles.ts`), but Payload's native REST at `/api/[...slug]`
is ALSO reachable by any authenticated session and enforces only the
COLLECTION-level `access` fns. `middleware.ts` matcher is `/admin*` only, so it
does NOT guard `/api/*`.

- `adminOnly = ({user}) => Boolean(user)` on Articles create/update/delete means
  ANY authenticated user (writer/contributor) can publish/delete via native REST,
  bypassing `articles:publish` / `articles:delete`. When reviewing, always ask:
  "does the collection-level access match the strictest capability the custom
  route enforces?" Capability checks in the route layer are meaningless if the
  collection grants the same op to all authenticated users.
- Field-level access is absent on `Articles.status/author/viewCount` and
  `Users.role/status`. Users is saved only because collection-level is
  `adminRoleOnly`. Prefer field-level `access.update` for privileged fields.

## Grandfather / migration gotcha

`resolveRole` falls back null→`admin` (fail-OPEN to most privileged). Migration
`20260708_...roles...` adds `role ... DEFAULT 'contributor' NOT NULL`, so the
fallback is dead code AND the pre-existing production admin is backfilled to
`contributor` (locked out). No seed re-promotes them.

# Decisions log — Kiribé Online

Product/engineering decisions that change scope or defer work. Newest first.
Each entry: what was decided, why, and what would reopen it.

## 2026-07-19 — Service worker / PWA deferred

**Decision:** No service worker in v1. The offline experience is detection +
honest messaging (`OfflineBanner`, `/offline` page), not cached articles. The
offline page copy was softened to match ("check your connection"), removing the
cached-articles claim.

**Why:** IMPLEMENTATION §3.3 is 2/5 done; a real SW (asset + article caching,
navigation fallback, write queueing) is meaningful scope with real staleness
risk, while the audit showed the current copy over-promised. Honest copy now,
SW when offline reading becomes a validated need.

**Reopens if:** analytics show meaningful repeat readership on unreliable
connections, or the team prioritizes offline reading as a feature.

## 2026-07-19 — Public creator detail pages deferred

**Decision:** Creators remain an admin-managed collection surfaced in homepage
Spotlight/Reels rows only. No public `/creators/[slug]` detail pages in v1.

**Why:** The half-built state (slugs + admin CRUD, no public page) is a
dead-end, but a good public profile page needs content the team isn't
producing yet (bios, filmography, links). Deferring explicitly beats shipping
a thin page.

**Reopens if:** editorial starts producing creator-centric content, or
Spotlight click-through demand shows up in analytics.

## 2026-07-19 — Admin password reset deferred (docs reconciled)

**Decision:** No self-service password reset in v1. USER-FLOW's "use forgot
password on the admin login page" promise is corrected to match
AUTH-HARDENING's deferral: an admin with `users:manage` re-issues access via
the invite flow (invite tokens rotate credentials on accept), or
`scripts/create-admin.mjs` resets the bootstrap account.

**Why:** The invite flow already provides a secure credential-rotation path
for a small team; a public reset endpoint adds attack surface (enumeration,
token handling) for little gain at this team size.

**Reopens if:** the team grows beyond a handful of seats or lockouts become a
recurring support burden.

## 2026-07-23 — Article edit ownership: scope non-editor edits (closes M3)

**Decision:** Writers and contributors may only edit, delete, and create-
under their own byline. Editors and admins may act on any article. Enforced
at three layers: (1) the Payload `Articles` collection `access.update`/
`.delete` return a row-scoped `{ author: { equals: user.id } }` filter for
non-editors; (2) the admin route handlers (PATCH, DELETE, POST, bulk) re-
check ownership after `overrideAccess`; (3) authorId reassignment on create
or update is editor-only, so a writer can't hand off or claim authorship.

**Why:** Option (a) — the minimum policy change that lets us safely invite
external contributors. The in-review workflow (Wave 3) already provides the
submission spine; a heavier submit-for-review-only model (option c) can be
layered on later without redoing this ownership gate.

**Reopens if:** we adopt a full submit-for-review workflow that forbids
non-editors from editing their own published pieces without re-submission.

## 2026-07-19 — OPEN: article edit ownership (review finding M3)

Superseded by the 2026-07-23 decision above.

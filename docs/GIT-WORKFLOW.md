# Git Workflow — Kiribé Online

How code moves from a branch to production. Conventions adapted from the
BareLyrics platform playbook, extended to a three-tier promotion flow.

## Branches

| Branch | Role | Deploys to (Vercel) |
|--------|------|---------------------|
| `main` | **Production.** Only receives release PRs from `staging`. | Production domain |
| `staging` | **Staging.** Pre-production verification. Only receives promotion PRs from `develop`. | Fixed staging preview domain |
| `develop` | **Integration** (default branch). All feature work lands here first. | Preview deployments |
| `feat/<slug>` | One feature/task per branch, cut from `develop`. | Preview deployments |
| `fix/<slug>` / `chore/<slug>` | Bug fixes / repo chores, cut from `develop`. | Preview deployments |

Hotfix exception: a critical production fix may branch from `main`
(`fix/hotfix-<slug>`), PR into `main`, then be back-merged into `staging` and
`develop` immediately after.

## Database branches (Neon) — isolate work, protect the one production DB

There is exactly **one production database** (`main` Neon branch). Development work
must **never** run against it, and feature work should not all pile onto a single
shared dev DB where migrations and test data collide. Neon branching gives every
line of work its own cheap, copy-on-write Postgres branch — use it so nothing
clusters on production.

| Work | Neon branch | How |
|------|-------------|-----|
| Production | `main` | Never used for dev. `DATABASE_URL` points here **only** in Vercel Production. |
| `staging` | `staging` | Pre-prod verification only. |
| `develop` | `dev` | Shared integration DB. |
| **Each `feat/*` / `fix/*`** | **own ephemeral branch** | Neon–Vercel integration auto-creates a branch per preview deploy; locally, branch from `dev` and put its connection string in `.env.local`. |

Rules:
- **Migrations run first on your feature's own Neon branch**, verified there, before the PR — so a broken migration can never touch `dev`/`staging`/`main`.
- Prefer the **Neon–Vercel preview integration** (auto branch per PR, torn down on merge) so preview deploys never share state.
- For local work, create a branch (`neonctl branches create` or the console) off `dev`; delete it when the feature merges. Reset a polluted branch by re-branching from `dev`.
- Never hardcode a branch URL in the repo — `DATABASE_URL` is env-scoped (Vercel scopes / `.env.local`). See [DEPLOYMENT.md](./DEPLOYMENT.md).

## The route every change takes

```
feat/<slug> ──PR──▶ develop ──promotion PR──▶ staging ──release PR──▶ main
```

1. **Feature PR → `develop`** — squash-merge. One PR per feature/task.
2. **Promotion PR `develop` → `staging`** — merge commit (preserve history).
   Batch of features headed for verification. Title: `Release: <summary> → staging`.
3. **Release PR `staging` → `main`** — merge commit. Title:
   `Production release: <summary>`. Only after staging verification passes.
   **If the release carries a migration, see [Migrations on release](#migrations-on-release)
   before you merge** — CI's migrate step does not touch production.

CI (`.github/workflows/ci.yml`) runs migrate + typecheck + lint + build on every
push and PR to the three long-lived branches — against a throwaway service
container, never a real database. Vercel deploys via Git integration — no deploy
step in Actions (real env values live in Vercel).

## Migrations on release

**A green CI run does not mean production has been migrated.** Both CI jobs spin
up a throwaway `postgres:16` service container and migrate *that* from scratch —
they never touch Neon. Schema changes reach production only when someone applies
them.

This matters because the deploy and the migration are not atomic. Vercel ships
the new code the moment the release PR merges; if the column it expects doesn't
exist yet, every query against that table fails until the migration lands. A
field added to a Payload collection goes into the generated Drizzle schema, so
it appears in the column list of **every** query for that collection — not just
the code paths that read it.

Pick one of the two, per environment:

**Automated (preferred).** The `migrate-production` job in `.github/workflows/ci.yml`
runs on pushes to `main`, after `verify` passes. It is dormant until you
configure it:

| Kind | Name | Value |
|------|------|-------|
| Variable | `ENABLE_PROD_MIGRATE` | `true` |
| Variable | `PRODUCTION_APP_URL` | production origin, e.g. `https://kiribeonline.com` |
| Secret | `PRODUCTION_DATABASE_URL` | Neon **main** branch connection string |
| Secret | `PAYLOAD_SECRET` | the production value |

The job targets the `production` GitHub environment — add required reviewers to
it in repo settings if you want an approval gate before production DDL.

**Manual.** Run it against the target database *before* merging the release PR,
so the schema is ready when the new code deploys:

```bash
DATABASE_URL='<neon main connection string>' npm run migrate
```

Either way: migrations are forward-only in practice. Test on your feature's own
Neon branch first (see the Neon table above), and prefer additive, nullable, or
defaulted columns so old and new code can both run against the schema during the
deploy window.

## Commit messages

- Imperative subject, ≤72 chars: `type(scope): what it does`
  - `feat(security): count only failed logins toward the email rate bucket`
  - `fix(admin): reject uploads over MAX_UPLOAD_BYTES before buffering`
  - `chore: remove unused SVGR toolchain`
- Types: `feat`, `fix`, `chore`, `docs`, `ci`, `refactor`, `perf`, `test`.
  Scope is the module/domain (`cms`, `admin`, `site`, `api`, `security`, `brand`, `ux`).
- Real features get a wrapped (~72 col) body: what + why + anything a reviewer
  or future archaeologist needs.
- Keep the `Co-Authored-By` trailer when an agent wrote the code.

## Preflight before every commit / PR

1. `npm run lint` — 0 errors
2. `npm run typecheck` — no new errors
3. `npm run build` — passes
4. Verify behavior against the plan/acceptance criteria (`docs/plans/*`)
5. Sweep the diff: no commented-out code, unused imports, stray `console.log`, secrets
6. Security-sensitive work (auth, uploads, forms, list APIs) reviewed by the
   `code-reviewer` agent — mandatory per `CLAUDE.md`

## PR conventions

Use `.github/pull_request_template.md`. Every PR body carries:

- A **Summary table** (Type / Base / Plan doc)
- **What was introduced** — plain-language narrative first, then detail
- **How to test** — numbered, reproducible steps
- **Security checklist** — tick or strike each line
- Screenshots/videos for anything visual

PR titles mirror commit style: `feat(brand): KIRIBÉ loader + route progress`.
Promotion/release PRs enumerate the features they carry.

## Definition of Done

Code merged to `develop` + preflight green + docs updated
(`docs/IMPLEMENTATION.md` checkboxes, `docs/DESIGN.md`/`docs/DEVELOPER.md` if
architecture or design changed) + verified on the Vercel preview.

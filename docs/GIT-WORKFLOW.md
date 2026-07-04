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

## The route every change takes

```
feat/<slug> ──PR──▶ develop ──promotion PR──▶ staging ──release PR──▶ main
```

1. **Feature PR → `develop`** — squash-merge. One PR per feature/task.
2. **Promotion PR `develop` → `staging`** — merge commit (preserve history).
   Batch of features headed for verification. Title: `Release: <summary> → staging`.
3. **Release PR `staging` → `main`** — merge commit. Title:
   `Production release: <summary>`. Only after staging verification passes.

CI (`.github/workflows/ci.yml`) runs migrate + typecheck + lint + build on every
push and PR to the three long-lived branches. Vercel deploys via Git
integration — no deploy step in Actions (real env values live in Vercel).

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

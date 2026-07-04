# Kiribe Online

See [docs/PROJECT.md](./docs/PROJECT.md) for the full overview.

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Documentation

| Doc | Audience |
|-----|----------|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | **Where code goes** — read before adding features |
| [DEVELOPER.md](./docs/DEVELOPER.md) | Engineers |
| [DESIGN.md](./docs/DESIGN.md) | Design + frontend |
| [IMPLEMENTATION.md](./docs/IMPLEMENTATION.md) | Build checklist |
| [USER-FLOW.md](./docs/USER-FLOW.md) | Client / stakeholders |

## Figma

Design file: [Kiribe Website — Figma Make](https://www.figma.com/make/iBC8YfVwanBDq1nh1VTS9f/Kiribe-Website---Figma-Make?node-id=0-9)

Configure Figma MCP in Cursor (see `docs/DEVELOPER.md`). Do not commit API tokens.

## Agent workflow

This repo includes `.claude/agents/` definitions adapted from branddrive-mobile:

- `software-architect` — plan before build
- `software-developer` — implement with self-review
- `code-reviewer` — security-first review
- `qa-expert` — test pass before merge

Read `CLAUDE.md` for coding standards.

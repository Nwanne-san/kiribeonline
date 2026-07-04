# cursor.md

This file mirrors [CLAUDE.md](./CLAUDE.md). **CLAUDE.md is the source of truth.**

When updating project guidance, edit `CLAUDE.md` first, then sync any Cursor-specific notes here if needed.

## Cursor Task tool mapping

| Stage | `subagent_type` |
|-------|-----------------|
| Architecture | `software-architect` |
| Implementation | `software-developer` |
| Code review | `code-reviewer` |
| QA | `qa-expert` |

Optional user skills (not separate agents): `review-security`, `review-bugbot` — use for diff review; still run `code-reviewer` before merge on auth/forms/list APIs.

## List URL state rule

See `.cursor/rules/kiribe-list-url-state.mdc` — editorial list pages must sync `page`, `limit`, `q`, `view`, and `filter` to the URL via shared hooks; limits from `@/constants`.

### Summary

| | |
|---|---|
| **Type** | feat / fix / chore / docs / ci |
| **Base** | `develop` (features) · `staging` (promotion) · `main` (release) |
| **Plan** | `docs/plans/…` or N/A |

### What was introduced

<!-- Plain-language summary first, then technical detail -->

### How to test

<!-- Numbered steps to verify -->

### Security checklist

- [ ] No secret / token reaches the client (only `NEXT_PUBLIC_*` in client code)
- [ ] Public write endpoints: server-side validation + rate limit (429 with `Retry-After`)
- [ ] Admin mutations verify the Payload session server-side
- [ ] Uploads validated server-side (MIME allowlist, `MAX_UPLOAD_BYTES`)
- [ ] User-rendered content is safe (no raw HTML, link schemes allow-listed)

### Preflight

- [ ] `npm run lint` — 0 errors
- [ ] `npm run typecheck` — no new errors
- [ ] `npm run build` — passes
- [ ] Follows `CLAUDE.md` patterns (thin routes, route enums, constants from `@/constants`)
- [ ] `docs/IMPLEMENTATION.md` updated if phase work completed
- [ ] Security-sensitive changes reviewed with `code-reviewer` agent

### Screenshots / Videos

<!-- UI evidence for editorial changes -->

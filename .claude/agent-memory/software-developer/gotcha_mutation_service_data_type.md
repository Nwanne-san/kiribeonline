---
name: gotcha-mutation-service-data-type
description: useMutationService function-form service types its `data` as the full Req — return a partial body and typecheck fails
metadata:
  type: feedback
---

In `useMutationService`, the function form of `service` — `(vars: Req) => ({ path, method, data })` — types the returned `data` as `Req`, not a partial. Returning a subset of the variables as `data` (e.g. `data: { role, status }` when `Req` is `{ id, role, status }`) fails typecheck with TS2322.

**Why:** the `ServiceConfig<Req>` function variant declares `data?: Req`, so any explicit body must be the whole `Req` shape.

**How to apply:** when the request body is a subset of your mutation variables, do NOT set `data` in the returned config. Return only `{ path, method }` (the id/path params still come from `vars`), and the hook falls back to sending the full variables object as the body. Server-side zod DTOs are non-strict (`z.object` without `.strict()`), so extra keys like `id` are stripped — safe. Pattern used in `UsersRolesPage` update/remove mutations.

---
name: gotcha-unsaved-changes-guard-redirect
description: A monkey-patched router.push guard will intercept the caller's own post-save redirect until React re-renders and the effect cleanup runs
metadata:
  type: feedback
---

An unsaved-changes guard implemented by monkey-patching `router.push` /
`router.replace` at mount (dependent on a `dirty` flag) has a subtle timing
trap: right after a successful save, the code path typically is:

```ts
setDirty(false);      // state update — batched, does NOT re-render synchronously
navigate(...)         // fires while the effect is still armed
```

The `useEffect` that installed the patch reads the `dirty` value from the
render that committed with `dirty === true`; the cleanup runs only when React
re-renders with `dirty === false` and diffs the effect deps. So the patched
`router.push` is still in place at the moment the post-save redirect calls it,
and the user sees a "Leave without saving?" confirm dialog on the very save
that cleared the flag.

**Why:** learned it in `feat/editorial-workflow-v2` when the new-article POST
+ redirect flow prompted the user on every successful save.

**How to apply:** any monkey-patch-based nav guard hook must expose a
`navigateSafely(href, mode)` API that calls through to the ORIGINAL push/
replace (kept in a ref that's populated by the same effect). See
`src/modules/admin/hooks/useUnsavedChangesGuard.ts`. Any component doing
programmatic navigation as part of a save must use that bypass — do NOT rely
on setDirty(false) to disarm the guard in time.

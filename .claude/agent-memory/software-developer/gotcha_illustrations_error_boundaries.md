---
name: gotcha-illustrations-error-boundaries
description: Traps when using brand illustrations on colored surfaces and building global-error/not-found in this repo
metadata:
  type: feedback
---

Branded illustrations in `src/modules/shared/components/illustrations/` hard-code
brand colors via `var(--color-burgundy)` / `var(--color-mustard)`.

**Rule:** Do NOT drop these illustrations onto a colored (burgundy/green) bar —
the burgundy strokes vanish. On colored surfaces (e.g. `OfflineBanner`) use a
small inline SVG glyph with `stroke="currentColor"` instead.

**Rule:** `src/app/global-error.tsx` renders when the root layout fails, so
`globals.css`, the MUI theme, and the `@theme` CSS custom properties are NOT
loaded. Use literal hex colors + inline styles only; never `var(--color-*)` or
Tailwind classes there. (Ordinary `not-found.tsx` / `(site)/error.tsx` DO have
the shell, so Tailwind + the shared `EmptyState` work fine.)

**Why:** Learned building PLAN-ILLUSTRATIONS-STATES. Both are silent failures —
they typecheck and lint clean but render invisibly/unstyled at runtime.

**How to apply:** Reach for `EmptyState` ([[]]) + an illustration on normal
light surfaces; drop to hand-rolled `currentColor` glyphs / literal hex on
colored bars and the global error boundary.

# Plan — Kiribé Logo Loader, Motion System & Premium Polish

Status: DRAFT (from 2026-07-04 review, findings L1–L3, U4–U5)
Touches: `public/brand/`, `src/theme/tailwind.css`, new
`src/modules/shared/components/brand/`, `SiteHeader`, `DataRenderer`, route
`loading.tsx` files

## Goals

A signature loading animation built from the KIRIBÉ wordmark, a real motion token
scale, sharp vector brand assets everywhere, and a navbar route-transition
indicator — the connective tissue of "premium".

## Step 1 — Vector logo (L1, prerequisite for everything else)

The only asset is `public/brand/kiribe-logo.png` (4375×2730 raster). DESIGN §15
already lists "Export KIRIBÉ logo SVG from Figma" as an open item.

- **Preferred:** export SVG from Figma (file `iBC8YfVwanBDq1nh1VTS9f`) via MCP
  (`download_figma_images`) — blocked until Figma MCP is connected
  (IMPLEMENTATION §1.4 pending).
- **Fallback (unblocks now):** auto-trace the PNG (`potrace`/Illustrator image
  trace) — the mark is flat single-color, so tracing is near-lossless. Replace
  with the Figma export later; keep identical path/group structure.
- Structure the SVG with **one `<g id>` per glyph** (K, Ì-dot, Ì, R, I, B, É,
  É-accent) — the accents and tittles are separate marks in the logo, perfect
  stagger targets.
- Deliverables in `public/brand/`: `kiribe-logo.svg` (full wordmark),
  `kiribe-mark.svg` (single "K" for favicon/compact loader), favicon set
  (`icon.svg`, `apple-icon.png` via Next metadata file conventions in `src/app/`).
- `SiteHeader` `BrandMark` switches to the SVG (fixes L3 — no more scaling a
  4375px PNG to 40px).

## Step 2 — Motion tokens (U5)

Extend `@theme` in `src/theme/tailwind.css` (today: one easing, one keyframe):

```css
--ease-out-soft: cubic-bezier(0.16, 1, 0.3, 1);   /* existing */
--ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1); /* playful overshoot — matches the hand-drawn brand */
--duration-fast: 150ms; --duration-base: 250ms; --duration-slow: 400ms;
```

Keyframes: `shimmer` (skeleton sheen), `letter-pop` (scale 0→1.06→1 with
opacity), `accent-flick` (small rotate/translate for the tittles/accents),
`bar-indeterminate` (route progress). Utilities for each. Everything wrapped in
`@media (prefers-reduced-motion: reduce)` overrides that reduce to a simple fade.

## Step 3 — `KiribeLoader` component

`src/modules/shared/components/brand/KiribeLoader/` — the inline SVG wordmark with
per-glyph CSS animation:

- Letters `letter-pop` in sequence (~70ms stagger, `--ease-spring`), the Ì-dot and
  É-accent `accent-flick` in last — reads like the logo being hand-stamped.
  Loop: brief hold at full logo, soft fade, repeat.
- Sizes: `sm` (24px height, mark-only "K" spinner for inline/admin), `md` (80px,
  content areas), `lg` (120px, full-page).
- Accessibility: `role="status"`, `aria-label="Loading"`, reduced-motion → static
  logo with a gentle opacity pulse.
- Pure CSS (no JS animation lib; no new dependency per CLAUDE.md).

Wire it in:

- `DataRenderer` `DefaultLoadingElement`: replace the generic MUI
  `CircularProgress` (U4) with `KiribeLoader size="md"`. (List surfaces keep
  skeletons per DESIGN §9 — the loader is for non-list waits.)
- Admin screens: `KiribeLoader size="sm"` replaces centered circular progress.
- New route-level `loading.tsx` for `articles/[slug]`, archive, categories, tags,
  search: skeletons where layout is known, `KiribeLoader` centered otherwise.

## Step 4 — Navbar route-transition indicator (L2)

`RouteProgress` client component mounted inside `SiteHeader`:

- A 2px mustard bar pinned to the header's bottom edge; on navigation start it
  animates `bar-indeterminate`, on settle it completes and fades. Implement with
  `useLinkStatus`/router events available in Next 15; fallback approach: wrap
  navigations via a small context + `startTransition` pending state
  (`useTransition`) around `router.push` in nav links.
- Simultaneously the header `BrandMark` gets class `is-loading`, which runs the
  accent-flick on the Ì-dot/É-accent glyphs — subtle logo "wink" while loading.
- Also render `RouteProgress` in the admin shell header.

## Step 5 — Premium micro-polish (small, do alongside)

- Skeletons: add the `shimmer` sheen over the existing `animate-pulse` blocks.
- `animate-fadeIn` on page-level content mount (already exists — apply
  consistently to main content wrappers).
- Card hover: unified `--duration-fast` transition tokens replacing the hardcoded
  `color 120ms ease` inline transitions in `SiteHeader` and cards.
- Blur-up image placeholders come from PLAN-IMAGES Phase D — together with this
  plan they cover the two most-felt loading moments (images + navigation).

## Suggested order

1 (SVG trace fallback) → 2 (tokens) → 3 (loader) → 4 (route progress) → 5 (polish).
Swap in the Figma-exported SVG whenever MCP access lands — no other step changes.

## Acceptance criteria

- Logo renders crisp at all header/footer/drawer sizes on 2x displays; favicon
  visible in tab.
- Slow-3G navigation shows the mustard progress bar + logo wink; no layout shift.
- Non-list loading surfaces show the animated wordmark, never a generic spinner.
- With `prefers-reduced-motion: reduce`, all animation reduces to fades/static.
- No new runtime dependency; `npm run build`, `lint`, `typecheck` clean.

## Review gates

`code-reviewer` then `qa-expert` (cross-browser: Safari SVG animation quirks,
reduced-motion). Update DESIGN.md §9 (motion section) and §15 open items (logo
SVG exported), and IMPLEMENTATION §1.4 once tokens are confirmed.

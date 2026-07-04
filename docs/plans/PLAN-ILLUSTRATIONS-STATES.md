# Plan — Branded Illustrations & UI Feedback States

Status: DRAFT (from 2026-07-04 review, findings U1–U3)
Touches: new `src/modules/shared/components/illustrations/`, `src/app/error.tsx`,
`src/app/global-error.tsx`, `src/app/not-found.tsx`,
`src/modules/shared/components/feedback/` (GlobalEmptyState, DataRenderer),
`src/modules/system/`

## Goals

Every "nothing to show" moment — empty lists, no search results, 404, crashes,
offline — gets a branded illustration and consistent copy, replacing plain text and
unstyled Next.js defaults. This is the single biggest premium-feel win per effort.

## Step 1 — Illustration set (inline SVG components)

New `src/modules/shared/components/illustrations/` — hand-drawn editorial line-art
matching the logo's playful hand-lettered energy: 2.5px ink strokes, burgundy
(`--color-burgundy`) primary, mustard (`--color-mustard`) single-accent, cream
background shapes. Each is a React component emitting inline SVG (themeable via
`currentColor`/CSS vars, zero network requests), ~240×180 viewBox, `aria-hidden`.

| Component | Concept | Used for |
|---|---|---|
| `EmptyShelfIllustration` | film-reel canister on an empty shelf | no articles in list/category/tag |
| `NoResultsIllustration` | magnifying glass over blank clapperboard | search, filtered archive |
| `LostSceneIllustration` | torn film strip / "Scene 404" slate | not-found page |
| `BrokenProjectorIllustration` | projector with tangled film | error boundary, DataRenderer error |
| `OfflineAntennaIllustration` | TV antenna with dropped signal waves | offline page + banner |
| `EmptyMediaIllustration` | empty picture frame | admin media library, MediaPicker |
| `InboxIllustration` | envelope with mustard seal | subscribe/contact success |

Authoring: draw as SVG code directly (they're simple line-art), or in Figma
(file `iBC8YfVwanBDq1nh1VTS9f`) and export — either way the deliverable is inline
SVG components, exported assets go to `public/` per CLAUDE.md if reused outside
React.

## Step 2 — One EmptyState to rule them all (U3)

Consolidate the three implementations into a single Tailwind component
`src/modules/shared/components/feedback/EmptyState/`:

```tsx
<EmptyState
  illustration={<NoResultsIllustration />}
  title="No stories match your search"
  description="Try a different title or browse all articles."
  action={{ label: "Clear filters", href: ... }}   // or onClick
/>
```

- Rewrite `GlobalEmptyState` internals to this (keep its export as a thin alias so
  callers migrate gradually — Kiribe-wrapper seam rule from CLAUDE.md).
- `DataRenderer` `DefaultEmptyElement` and `DefaultErrorElement` use it with the
  appropriate illustration and a retry action.
- Update callers with tailored copy: `ArticleListView`, `CategoryArchivePage`,
  `TagArchivePage`, search page, admin media/list screens (admin keeps the same
  component, denser spacing variant).

## Step 3 — Error boundaries & 404 (U1)

- `src/app/not-found.tsx` — `LostSceneIllustration`, "This scene didn't make the
  cut.", links to Home + All Articles. Wrapped in `SiteLayout` chrome.
- `src/app/(site)/error.tsx` — client component, `BrokenProjectorIllustration`,
  "Something went wrong." + `reset()` retry button; log the error digest.
- `src/app/global-error.tsx` — minimal self-contained version (own `<html>` body,
  inline styles — it renders when the root layout itself fails).
- `src/app/admin/error.tsx` — plain admin-styled variant (burgundy progress rules
  from FIGMA-ADMIN-PROMPT apply; keep it functional over decorative).
- SEO: 404 page sets metadata `robots: noindex` (Next does status code correctly).

## Step 4 — Offline detection (U2)

Make the existing `OfflinePage` reachable and add live feedback:

- `useOnlineStatus()` hook in `src/utils/hooks/` (`navigator.onLine` +
  `online`/`offline` events; SSR-safe default true).
- `OfflineBanner` in `src/modules/system/components/`, mounted in `SiteLayout`:
  slim burgundy bar, `OfflineAntennaIllustration` glyph at 20px, "You're offline —
  some stories may be unavailable", auto-dismiss on reconnect with a brief
  "Back online" success state. `role="status"`, `aria-live="polite"`.
- Full service-worker/PWA caching stays a separate effort (IMPLEMENTATION §3.3);
  this step delivers the visible offline UX without it. When the SW lands, its
  navigation fallback routes to `/offline`.

## Acceptance criteria

- Visiting a bogus URL shows the branded 404 inside the site chrome.
- Throwing inside an article page shows the branded error boundary with working
  retry.
- Empty search/category/tag/list states show illustrations + tailored copy +
  action.
- Toggling DevTools offline shows the banner within a second; reconnecting
  dismisses it.
- All illustrations respect `prefers-reduced-motion` (no ambient animation) and
  are `aria-hidden` with text conveying the state.
- No new component library added (CLAUDE.md constraint) — plain SVG + Tailwind.

## Review gates

`code-reviewer` (error boundaries touch error handling paths), then `qa-expert`
pass across breakpoints. Update IMPLEMENTATION §3.3 banner/offline items and
DESIGN.md §7.7 / §9 with the illustration system.

# Kiribe Online — Design System

Source: TRD v2.2, PRD v1.0, Figma Make **V5** (client screenshots, June 2026).

**Figma:** [Kiribe Website — Figma Make](https://www.figma.com/make/iBC8YfVwanBDq1nh1VTS9f/Kiribe-Website---Figma-Make?node-id=0-9)

**Active design variant:** V5 (Clean / Bold / Luxury / V4 / **V5**)

---

## 1. Brand direction

Premium editorial magazine — film, TV, opinion, news, spotlight, culture.

- White/off-white page backgrounds with deep burgundy and gold accents
- Strong photography and clear typographic hierarchy
- Modular homepage sections stacked vertically, each with a category header + 3-column card grid
- Full-width maroon subscribe band before the footer
- Dark navy footer with multi-column links

---

## 2. Typography

| Role | Font | Usage |
|------|------|--------|
| Display / section titles | **Outfit** (or serif display when exported from Figma) | Section headers (`FILM`, `OPINION`), hero titles |
| Logo wordmark | Stylized display | `KIRIBÉ` in burgundy |
| Body & UI | **Open Sans** | Nav links, excerpts, metadata, forms |
| Labels | Open Sans, uppercase, tracked | Category tags, section kicker text |

### Scale — fluid

Sizes are **fluid `clamp()` tokens**, defined once in `src/theme/tailwind.css`
`@theme` and referenced by `muiTheme.ts` typography variants. They interpolate
with the viewport, so call sites must **not** add `fontSize: { xs, md }` ramps.

| Token | Mobile → desktop | Weight | Notes |
|-------|------------------|--------|-------|
| `--text-display` | 32 → 56px | 700 | Archive hero, article title |
| `--text-section-title` | 24 → 32px | 700 | `FILM`, `NEWS & UPDATES` — all caps |
| `--text-card-title` | 18 → 24px | 700 | Article card headlines |
| `--text-body` | 15 → 16px | 400 | Excerpts, bio text |
| `--text-body-sm` | 14px (fixed) | 400 | Metadata, footer links |
| `--text-label` | 12px (fixed) | 600 | Category tags, `VIEW ALL` |

Tailwind: `text-display`, `text-card-title`, … MUI: `h1`/`h2`/`h3` and the
`kicker` / `sectionTitle` / `cardTitle` variants already resolve to these.
Bespoke display sizes outside this scale (home hero, spotlight name) use an
inline `clamp()` rather than a stepped breakpoint ramp.

Section titles include a **short gold underline** beneath the first word or first two letters.

---

## 3. Color palette (V5)

### Core brand

| Token | Hex | Usage |
|-------|-----|--------|
| `kiribe-burgundy` | `#6B1D2A` | Logo, primary buttons, section titles, active nav |
| `kiribe-burgundy-dark` | `#4A1420` | Hover on primary buttons |
| `kiribe-mustard` | `#C9A227` | Category labels, gold underlines, subscribe submit |
| `kiribe-mustard-light` | `#EAB308` | Subscribe button background (archive uses this) |
| `kiribe-cream` | `#FAF8F5` | Page background |
| `kiribe-ink` | `#1A1A1A` | Headlines, body |
| `kiribe-muted` | `#6B7280` | Excerpts, metadata |
| `kiribe-white` | `#FFFFFF` | Header, cards, inputs |
| `kiribe-footer` | `#0A0A0A` | Footer background |
| `kiribe-hero-dark` | `#1C1214` | All Articles archive hero (diagonal gold lines) |

### Category accent colors (filters & badges)

Used on All Articles filter pills and card category badges.

| Category | Border / badge | Text |
|----------|----------------|------|
| `ALL` (active) | `#1A1A1A` fill | white |
| `FILM` | `#6B1D2A` | `#6B1D2A` |
| `TV` | `#1A1A1A` | `#1A1A1A` |
| `OPINION` | `#C9A227` | `#C9A227` |
| `NEWS` | `#2563EB` | `#2563EB` |
| `SPOTLIGHT` | `#7C3AED` | `#7C3AED` |
| `DOCUMENTARY` | `#15803D` | `#15803D` |
| `EVENTS` | `#0D9488` | `#0D9488` |

Implementation: `src/theme/category-colors.ts` + Tailwind tokens.

---

## 4. Layout

### 4.1 Breakpoints (single source of truth)

Defined once in `src/theme/tailwind.css` `@theme` and mirrored into
`src/theme/muiTheme.ts`, so a given name means the same width in **both** stacks.

| Name | Width | Typical use |
|------|-------|-------------|
| `xs` | 0 (MUI) / 24rem = 384px (Tailwind) | Base / small phone |
| `sm` | 30rem = 480px | Large phone |
| `md` | 48rem = 768px | Tablet portrait — cards go 2-up |
| `base` | 64rem = 1024px | Laptop — cards go 3-up, sidebars split |
| `lg` | 80rem = 1280px | Desktop — nav expands, social rail appears |
| `xl` | 90rem = 1440px | Wide desktop |
| `2xl` | 100rem = 1600px | Admin dashboard wide tiers |
| `3xl` | 120rem = 1920px | Reserved |

**Units are rem, in both stacks.** MUI is configured with
`breakpoints.unit: "rem"` to match Tailwind v4. This is deliberate: a rem media
query keys off the browser's default font size, so readers who enlarge theirs
get the roomier layout sooner. Never declare a breakpoint in px — that only
agrees with these at a 16px root and silently re-splits the two stacks for the
readers who most need the help.

`base`, `2xl` and `3xl` are Tailwind's own keys, added to MUI via
`BreakpointOverrides` in `src/theme/mui.d.ts`. `xs` is the single key the two
stacks cannot reconcile (MUI's zero-floor vs Tailwind's 24rem query).

**Editorial grid rhythm:** 1 column → `md` 2 columns → `base` 3 columns. Use
`base`, not `lg`, for content-density changes; `lg` is for chrome (nav, rails).
When a skeleton mirrors a grid, it must use the *same* keys — a mismatch is a
guaranteed layout shift when content replaces it.

In JS, read breakpoints through `useBreakpointUp` / `useBreakpointDown`
(`src/utils/hooks/useBreakpoint.ts`) — never a hardcoded `matchMedia` string.
Prefer CSS show/hide over JS wherever possible.

### 4.2 Dimensions

- **Max content width:** 1200px — token `--container-editorial`. MUI `Container`
  defaults to `maxWidth={false}` with a root override in `muiTheme.ts`, so its
  width is decoupled from the `lg` breakpoint and matches Tailwind surfaces
  exactly. Do not pass `maxWidth` to `Container` — it reintroduces the split.
- **Admin width:** 1280px — token `--container-admin` (`max-w-admin`). Separate
  on purpose: the admin is a workbench (tables, editor sidebar), not a reading
  column, so tuning reading measure must not resize it.
- Never hardcode a container width.
- **Homepage sections:** full-width white band → inner container → section header row → 3-column card grid
- **Gutter:** 24px between cards (desktop), 16px mobile
- **Section vertical rhythm:** 64px padding top/bottom per section

---

## 5. Global chrome

### 5.1 Site header (navbar)

Three-zone layout on white background, bottom border.

| Zone | Content |
|------|---------|
| **Left** | `KIRIBÉ` logo wordmark (burgundy, linked to home) |
| **Center** | Nav links (uppercase): `FILM`, `TV`, `VIDEOS`, `NEWS`, `OPINION`, `SPOTLIGHT`, `ALL ARTICLES` |
| **Right** | **Search icon** (icon button) → **Subscribe CTA** (burgundy filled button, white uppercase text) |

**Important:** Search and Subscribe sit on the **right side** of the navbar, not mixed into center nav.

Mobile (below `md`): hamburger + logo left; search + subscribe right.

Component: `SiteHeader` — `src/modules/shared/components/SiteHeader/`

### 5.2 Site footer

Dark navy background, four columns:

1. Logo + tagline ("Your source for thoughtful entertainment journalism.")
2. **Sections:** Film, Television, Videos, News
3. **About:** About Us, Editorial Team, Contact
4. **Follow:** Instagram, Twitter, YouTube

Bottom bar: `© 2025 Kiribe Online. All rights reserved.`

Component: `SiteFooter`

---

## 6. Homepage (V5) — section map

Stack order top → bottom:

| # | Section | Layout | Notes |
|---|---------|--------|-------|
| 1 | **Hero + Editor's Picks** | 2/3 featured image + 1/3 sidebar list | Sidebar: `EDITOR'S PICKS` header, category + headline rows, `MORE NEWS >` |
| 2 | **FILM** | SectionHeader + 3-col ArticleCard grid | |
| 3 | **TELEVISION** | Same pattern | |
| 4 | **OPINION** | Same pattern | |
| 5 | **NEWS & UPDATES** | Same pattern | |
| 6 | **REELS & SHORTS** | 6-col vertical video cards | Play button overlay, social icon top-right, caption bottom-left |
| 7 | **SPOTLIGHT** | Featured profile (2-col) + achievement cards + `MORE CREATORS` 4-col grid | Profile tabs: This Month / Exclusive / Trendsetter |
| 8 | **Browse All Articles** | Centered white band | Kicker + title + `VIEW ALL ARTICLES` burgundy button |
| 9 | **Subscribe band** | Full-width burgundy | Gold envelope icon, email input + gold `SUBSCRIBE` button, privacy note |
| 10 | **Footer** | Dark multi-column | |

> v1 PRD may hide some top-level nav items initially; keep components reusable so sections can be toggled on without redesign.

---

## 7. All Articles page (`/articles`)

### 7.1 Archive hero

- Dark background with subtle diagonal gold line pattern
- Kicker: `KIRIBÉ EDITORIAL ARCHIVE` (gold, small caps)
- Title: `All Articles` (large white) with gold accent underline
- Description paragraph (white, centered)

Component: `ArchiveHero`

### 7.2 Toolbar row

Single row below hero (white background):

| Element | Spec |
|---------|------|
| **SearchBar** | Full-width input, light border, magnifying glass left, placeholder `"Search articles, authors..."` |
| **ViewToggle** | Two square icon buttons on the right: grid (4 squares) and list (3 lines). Active state: burgundy fill + white icon |

Components: `SearchBar`, `ViewToggle`

### 7.3 Category filter bar

Horizontal scroll/wrap row of pill buttons:

- **ALL** — active: dark fill, white text
- Category pills — white fill, colored border matching category accent (see §3)
- Clicking filters the article list (client or URL query `?category=film`)

Component: `CategoryFilterBar` + `CategoryFilterPill`

### 7.4 Results meta

- Left: `"16 articles"` count label (grey, small)

### 7.5 Grid view

3-column responsive grid (1 col mobile, 2 tablet, 3 desktop).

**ArticleCard (grid variant):**

```
┌─────────────────────┐
│ [image]             │
│ ┌FILM┐ (badge TL)   │
│                     │
├─────────────────────┤
│ Title (bold)        │
│ Excerpt (grey)      │
│ 👤 Author · 🕐 6 min│
└─────────────────────┘
```

- Category badge overlays top-left of image (solid fill, white text)
- Optional second tag below image in list view

Component: `ArticleCard` variant=`grid`

### 7.6 List view

Vertical stack of horizontal rows separated by light dividers.

**ArticleCard (list variant):**

```
┌────────┐  [FILM] [SPOTLIGHT]     >
│ thumb  │  Title (large burgundy/black)
│        │  Excerpt (2 lines grey)
└────────┘  👤 Author · Date · 🕐 6 min read
```

- Thumbnail ~160×120 left
- Category tags as bordered pills above title
- Chevron `>` on far right
- Entire row clickable

Component: `ArticleCard` variant=`list`

### 7.7 Empty & loading states

- **Loading:** custom skeletons (see §9) — never generic grey boxes
- **Empty:** branded message + clear filters CTA

---

## 8. Reusable components

Build in `src/modules/shared/components/`. Import into editorial/marketing pages.

| Component | Props / variants | Used on |
|-----------|------------------|---------|
| `SiteHeader` | — | All public pages |
| `SiteFooter` | — | All public pages |
| `SectionHeader` | `title`, `viewAllHref?`, `showGoldRule?` | Homepage sections |
| `ArticleCard` | `variant: 'grid' \| 'list'`, article data | Homepage, archive |
| `CategoryBadge` | `category`, `variant: 'solid' \| 'outline'` | Cards, filters |
| `CategoryFilterBar` | `activeCategory`, `onChange` | All Articles |
| `CategoryFilterPill` | `label`, `color`, `active` | Filter bar |
| `SearchBar` | `value`, `onChange`, `placeholder` | All Articles |
| `ViewToggle` | `view`, `onChange: 'grid' \| 'list'` | All Articles |
| `ArchiveHero` | title, description | All Articles |
| `EditorPicksList` | items[] | Homepage sidebar |
| `SubscribeBand` | — | Homepage, footer area |
| `SubscribeForm` | inline email + button | Subscribe band |
| `VideoReelCard` | image, platform, label | Reels section |
| `SpotlightProfile` | profile data, achievements | Spotlight |
| `CreatorCard` | image, name, role | More Creators grid |
| `PrimaryButton` | burgundy filled CTA | Global |
| `AccentButton` | gold filled CTA | Subscribe forms |
| `AchievementCard` | icon, label, value | Spotlight |

### Component file pattern

```
src/modules/shared/components/ArticleCard/
├── ArticleCard.tsx
├── ArticleCard.types.ts
└── index.ts
```

---

## 9. Skeleton screens (custom)

Location: `src/modules/shared/components/skeleton/`

**Do not use spinners** for article lists. Use pulsing skeletons that mirror final layout.

### 9.1 `ArticleCardGridSkeleton`

Matches grid card: image block (16:10 aspect) → small tag line → 2 title lines → 2 excerpt lines → footer metadata row.

Render 6 or 9 in a 3-col grid.

### 9.2 `ArticleCardListSkeleton`

Matches list row: square thumb left → 2 tag pills → 2 title lines → 2 excerpt lines → metadata row. Include chevron placeholder.

Render 5–8 rows with dividers.

### 9.3 `ArchiveToolbarSkeleton`

One wide search bar block + two square toggle blocks. Below: row of 8 pill-shaped filter skeletons.

### 9.4 `SectionGridSkeleton`

Section title bar (short line + long line for "VIEW ALL") + 3 card grid skeletons. Used on homepage while sections load.

### 9.5 `EditorPicksSkeleton`

Sidebar: header line + 5 list items (each: small gold label line + 2 headline lines).

### 9.6 Animation

- Use `animate-pulse` with `bg-kiribe-border/60` blocks
- Rounded corners match real components (cards: `rounded-none` or subtle `rounded-sm` per Figma)
- `SkeletonBlock` adds a `.skeleton-shimmer` sheen over the pulse

### 9.7 Motion tokens & brand loader

Motion tokens live in `src/theme/tailwind.css` `@theme`: `--ease-out-soft`,
`--ease-spring`, `--duration-fast` (150ms) / `--duration-base` (250ms) /
`--duration-slow` (400ms). Keyframes: `shimmer`, `letter-pop`, `accent-flick`,
`bar-indeterminate`, `logo-pulse`. All animation collapses to fades/static under
`prefers-reduced-motion: reduce`.

- **`KiribeLoader`** (`src/modules/shared/components/brand/KiribeLoader/`): the
  KIRIBÉ wordmark hand-stamps in per glyph (70ms spring stagger, accents flick in
  last), holds, fades, loops. Sizes `sm` (24px, K mark) / `md` (80px) / `lg`
  (120px). Use for non-list waits; article lists keep skeletons (§9 rule).
- **`RouteProgress`**: 2px mustard indeterminate bar under the header during route
  transitions; the header logo accents "wink" while pending.
- **Illustrations** (`src/modules/shared/components/illustrations/`): 7 hand-drawn
  editorial line-art SVGs (burgundy strokes, single mustard accent) for empty,
  error, offline, 404, and media states — rendered via the consolidated
  `EmptyState` component.

---

## 10. Subscribe band (homepage)

Full-width burgundy section:

- Gold circle with envelope icon (centered top)
- White heading: "Subscribe to Kiribe Online"
- White body copy (2 lines, centered)
- Inline form: white email input + **gold** `SUBSCRIBE` button (dark text)
- Privacy note: "We respect your privacy. Unsubscribe at any time."

---

## 11. Imagery

| Context | Aspect ratio |
|---------|--------------|
| Hero featured | ~16:10 landscape |
| Article card (grid) | ~4:3 or 16:10 |
| List thumbnail | ~4:3, fixed width |
| Reels card | 9:16 vertical |
| Creator card | ~3:4 portrait |
| Spotlight profile | ~4:5 portrait |

All images: lazy load, `alt` from CMS, Next.js Image + R2.

---

## 12. Motion & interaction

- Card hover: subtle shadow or image scale (1.02)
- Filter pills: border color transition 150ms
- View toggle: instant active state swap
- Skeleton → content: fade in 200ms (optional)
- Focus rings on search, filters, nav links

---

## 13. Accessibility

- Search icon button: `aria-label="Search articles"`
- View toggle: `aria-pressed` on active button
- Category filters: `role="tablist"` or button group with `aria-current`
- Article cards: entire card wrapped in link with descriptive `aria-label`
- Subscribe form: label associated with email input (visually hidden ok)

---

## 14. Implementation map

| Design area | Code path |
|-------------|-----------|
| **MUI theme** | `src/theme/muiTheme.ts`, `src/theme/mui.d.ts` |
| **UI primitives** | `src/modules/shared/components/ui/` |
| Icons | `@mui/icons-material` (search, grid, list, etc.) |
| Design tokens | `src/theme/category-colors.ts` |
| Header / footer | `src/modules/shared/components/SiteHeader/` |
| Skeletons | `src/modules/shared/components/skeleton/` (MUI `Skeleton`) |
| Homepage sections | `src/modules/editorial/pages/HomePage/` |
| All Articles | `src/modules/editorial/pages/ArticlesPage/` |
| Layout wrapper | `src/modules/shared/layouts/SiteLayout/` |

### MUI usage rules

1. **Layout:** `Box`, `Stack`, `Grid`, `Container` — not raw `div` + Tailwind for structure
2. **Text:** `KiribeTypography` / MUI `Typography` with theme variants (`kicker`, `sectionTitle`, `navLink`, `cardTitle`)
3. **Forms:** MUI `TextField`, `Button`, `IconButton`
4. **Sections:** `EditorialSection` + `EditorialContainer`
5. **Loading:** MUI `Skeleton` via shared skeleton components
6. **Icons:** `@mui/icons-material` first; custom brand SVGs via `SvgIcon`

---

## 15. Open items

- [x] Logo SVG: interim high-fidelity auto-trace shipped (`public/brand/kiribe-logo.svg`, `kiribe-mark.svg`, favicon `src/app/icon.svg`; per-glyph groups in `src/modules/shared/components/brand/kiribe-glyphs.ts`). Swap in the Figma export when MCP access lands — keep the same glyph id set so `BrandMark`/`KiribeLoader` need no changes.
- [ ] Confirm whether section titles use serif or Outfit in production
- [ ] Mobile nav drawer design
- [ ] Article detail page V5 screens
- [ ] Exact hex audit against Figma RED AUDIT pass

---

## 16. Admin design {#admin-design}

Custom Kiribé admin UI (not Payload Studio). Full Figma Make prompt and review checklist: [`docs/FIGMA-ADMIN-PROMPT.md`](./FIGMA-ADMIN-PROMPT.md).

| Asset | URL / key |
|-------|-----------|
| Figma Make (paste prompts) | [Kiribe Website — Figma Make](https://www.figma.com/make/iBC8YfVwanBDq1nh1VTS9f) — `iBC8YfVwanBDq1nh1VTS9f` |
| Reference design file | [Kiribé Admin Dashboard](https://www.figma.com/design/5IYjhGgnhtcsgDvDOKN5O8) — `5IYjhGgnhtcsgDvDOKN5O8`, Admin page |

Admin uses the same V5 tokens (burgundy, cream, Outfit/Open Sans) but a utilitarian workbench layout: 240px sidebar, cream content area, white cards. Login uses archive-hero dark `#1C1214` backdrop only.

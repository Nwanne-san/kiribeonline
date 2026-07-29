# Figma Make — Kiribé Admin Dashboard Prompt

Use this document to design the full admin experience in [Kiribe Website — Figma Make](https://www.figma.com/make/iBC8YfVwanBDq1nh1VTS9f/Kiribe-Website---Figma-Make?node-id=0-9).

**How to use:** Copy the entire **Main prompt** block below into Figma Make chat. After the first pass, run each **Follow-up prompt** in order. Use the **Review checklist** to verify frames against the codebase.

**Figma Make file (paste prompts here):** [Kiribe Website — Figma Make](https://www.figma.com/make/iBC8YfVwanBDq1nh1VTS9f/Kiribe-Website---Figma-Make?node-id=0-9)

**Companion design file (MCP reference frames):** [Kiribé Admin Dashboard](https://www.figma.com/design/5IYjhGgnhtcsgDvDOKN5O8) — file key `5IYjhGgnhtcsgDvDOKN5O8`, Admin page with 20 frames. Use this as a wireframe reference; paste the main prompt into Make for the polished V5-aligned version.

---

## Main prompt

```
Design a complete Admin Dashboard UI system for "Kiribé Online" — a premium editorial magazine CMS used by a single admin to publish film, TV, opinion, news, and spotlight content. This is a custom admin app (NOT Payload Studio). Match the existing Kiribé V5 public brand but optimize for productivity: clean, calm, editorial-luxury workbench.

## Brand alignment (must match public V5)

Typography:
- Headings / page titles: Outfit, 600–700 weight
- Body, labels, table text, form UI: Open Sans
- Section kickers / table headers: Open Sans, 11–12px, uppercase, letter-spaced

Colors:
- Primary (buttons, active nav, focus rings): Burgundy #6B1D2A (hover #4A1420)
- Secondary accent (sparingly — subscribe-style CTAs only): Mustard #C9A227
- Page background: Cream #FAF8F5
- Cards / inputs / top bar: White #FFFFFF
- Text primary: Ink #1A1A1A
- Text secondary / metadata: Muted #6B7280
- Dividers / borders: #E5E7EB
- Login backdrop only: Archive hero dark #1C1214 (subtle diagonal gold line texture like public archive hero)
- Footer-dark #0A0A0A is for public site only — do NOT use in admin

Shape & density:
- Border radius 4px on buttons, inputs, cards
- No drop shadows on buttons
- Subtle 1px borders on cards and tables
- Max content width ~1200px in main area
- Left sidebar fixed 240px

Category accent colors (for status/category chips in admin lists):
- FILM #6B1D2A | TV #1A1A1A | OPINION #C9A227 | NEWS #2563EB | SPOTLIGHT #7C3AED | DOCUMENTARY #15803D | EVENTS #0D9488

## Global admin shell (all authenticated screens)

Layout:
- Permanent left sidebar (240px): wordmark "Kiribé Admin" in burgundy at top
- Nav items with icons + labels:
  1. Dashboard
  2. Articles
  3. Homepage
  4. Editor's Picks
  5. Media
  6. Categories
  7. Tags
  8. Settings
  9. Analytics
- Active nav: burgundy left bar or burgundy-tinted background + burgundy icon
- Main area: white top bar with right-aligned "Log out" button (outlined or text + logout icon)
- Page content in cream background with white cards/sections inside

Design reusable admin components as a mini design system frame:
- Primary button (burgundy fill, white label, loading spinner state)
- Outlined button (burgundy border)
- Destructive text button (red, for Remove image)
- Text field (outlined, burgundy 2px focus ring)
- Select / multi-select dropdown
- Date-time picker field
- Textarea (2-row excerpt, 12-row body)
- Status badge chips: draft (grey), scheduled (blue), published (green), archived (muted)
- Category/tag pills with accent borders
- Data table (compact, zebra optional)
- Stat card (label caption + large number)
- Empty state block ("Nothing here yet" + subtitle + optional CTA)
- Error state block ("Something went wrong" + "Try again" button)
- Loading: centered burgundy circular progress (no generic grey skeletons for admin v1)
- Toast / snackbar component (top-center, filled alert):
  - Success: "Article saved" / "Image uploaded"
  - Error: "Request failed" + description line
  - Info / Warning variants
  - Auto-dismiss ~5s, close X

---

## Screen 1 — Login (/admin/login)

Full viewport, centered card on dark #1C1214 backdrop.

Card (white, max 400px, padding 32px):
- Title: "Kiribé Admin" (Outfit h4)
- Subtitle: "Sign in to manage content." (muted)
- Fields: Email (required), Password (required, show/hide toggle icon)
- Inline error below fields (red text): "Invalid email or password." and "Login failed."
- Primary button full width: "Sign in" (loading state: "Signing in..." with spinner)
- Optional footer link: "Forgot password?" (muted, for future — show disabled or as text link)

States to show as variants:
- Default | Loading | Error | Empty fields validation

---

## Screen 2 — Dashboard (/admin/dashboard)

Page title: "Dashboard"

Row of 4 stat cards:
- Published | Drafts | Scheduled | Media
Each: small muted label + large number (e.g. 12, 3, 1, 48)

Quick actions row:
- Primary: "New article"
- Outlined: "Homepage builder"

Optional second row (aspirational, match CMS data model):
- "Recent articles" mini table: Title | Status chip | Views | Updated
- "Total views" summary line

---

## Screen 3 — Articles list (/admin/articles)

Header row: "Articles" title left | Primary "New article" right

Toolbar (aspirational polish):
- Search input: "Search articles..."
- Filter by status dropdown
- Optional view toggle (table default)

Table columns:
- Title (with optional small hero thumbnail)
- Status (badge chip)
- Views (number)
- Updated (relative date)
- Actions: "Edit" button (small primary)

States:
- Loading (spinner)
- Empty: "No articles yet" + "Create your first article" CTA
- Populated table with 6–8 sample editorial titles (film/TV/opinion themed)

---

## Screen 4 — New / Edit article (/admin/articles/new and /edit)

Page title: "New article" or "Edit article"

Two-column editorial form layout (desktop):
LEFT (main, ~65%):
- Title* (text)
- Excerpt (textarea, 2 rows)
- Body* (large textarea, 12 rows, helper: "Separate paragraphs with a blank line.")
- SEO section (collapsible card):
  - SEO title
  - SEO description (textarea)
  - OG image (media picker)

RIGHT (sidebar, ~35%, sticky):
- Status* select: Draft | Scheduled | Published | Archived
- Publish date (datetime-local)
- Featured checkbox + helper "Show on homepage featured modules"
- Featured priority (number, optional)
- Hero image (media picker — see component below)
- Categories (multi-select)
- Tags (multi-select)
- View count (read-only, edit mode only): e.g. "1,284 views"

Footer action bar (sticky bottom or end of form):
- Primary "Save" (loading: "Saving...")
- Outlined "Cancel"
- Optional destructive "Archive" or "Delete" on edit screen

Toast on save success: "Article saved" — "Your changes are live on the site." (if published)

Validation errors (inline under fields + toast):
- "Title is required"
- "Body is required"
- "Publish date is required for scheduled articles"

---

## Screen 5 — Media picker modal (reusable)

Triggered from Hero image, OG image, etc.

Dialog title: "Select image"
Tabs: Library | Upload

Library tab:
- Responsive square thumbnail grid (4 cols desktop)
- Hover: burgundy border
- Selected: burgundy 2px border + checkmark
- Empty: "No images yet" + "Upload an image from the Upload tab."

Upload tab:
- Outlined "Choose file" button (shows filename after pick)
- Alt text* field + helper "Describe the image for screen readers."
- Accepted: JPEG, PNG, WebP, GIF
- Primary "Upload" (disabled until file + alt filled; loading state)
- Success toast: "Image uploaded"

Selected state preview (outside modal):
- 96×96 thumbnail preview
- "Change image" outlined button
- "Remove" red text button
- Placeholder "None" when empty

---

## Screen 6 — Media library (/admin/media)

Header: "Media library" | Primary "Upload"

Grid of media cards (160px+):
- Square image preview
- Filename or alt caption below
- Optional metadata: dimensions, usage count badge ("Used in 3 articles")
- Hover actions: copy URL, delete (with confirm dialog)

Upload flow (same as picker Upload tab)
Empty state: "No images yet" + Upload CTA

Optional detail drawer on click:
- Alt text (editable)
- Caption
- Credit / photographer
- Usage count (read-only)

---

## Screen 7 — Homepage builder (/admin/homepage)

Page title: "Homepage builder"

Section A — Hero:
- Select "Hero article" from published articles dropdown
- Preview card showing selected article title + hero thumbnail

Section B — Category sections:
- Repeatable module cards (bordered white panels), each with:
  - Enabled toggle
  - Category select
  - Section title (text, e.g. "FILM")
  - Layout select: 3-column grid | 2-column grid | List | Hero + grid
  - Max items (number, 1–12)
  - Article selection: Auto (latest) | Manual picks
  - If manual: multi-select articles
  - Sort order (number)
  - Drag handle for reorder (show on 2+ modules)

Actions:
- Outlined "Add section"
- Primary "Save homepage" (loading: "Saving...")
- Success toast: "Homepage updated"

Show 2 sample modules filled (FILM grid-3, OPINION grid-3) + one collapsed empty module.

---

## Screen 8 — Editor's Picks (/admin/homepage/editors-picks)

Page title: "Editor's Picks"
Helper: "Up to 5 articles shown in the homepage sidebar."

Stack of 5 article select fields: "Pick 1" … "Pick 5"
Each shows article title in dropdown + optional drag reorder

Actions:
- Outlined "Add pick" (disabled at 5)
- Primary "Save picks"

Mini preview panel (aspirational): sidebar mock showing EDITOR'S PICKS list with category + headline rows

---

## Screen 9 — Categories (/admin/categories)

Page title: "Categories"

Create form (max width ~480px):
- Category name*
- Description (textarea, optional — CMS field)
- Display order (number, optional)
- Primary "Create"

Below: table of existing categories
Columns: Name | Slug | Display order | Updated | Actions (Edit)

Sample rows: Film, Television, Opinion, News, Spotlight

---

## Screen 10 — Tags (/admin/tags)

Same pattern as Categories but simpler:
- Tag name* + Create button
- Table: Name | Slug | Updated

---

## Screen 11 — Site settings (/admin/settings)

Page title: "Site settings"
Max width ~560px

Fields:
- Site name (default "Kiribe Online")
- Logo upload (media picker)
- Default SEO description (textarea, 3 rows)
- SEO defaults expand: default SEO title, default OG image
- Social links repeater: Platform + URL rows with Add/remove

Primary "Save settings" + success toast

---

## Screen 12 — Analytics (/admin/analytics)

Page title: "Analytics"

Top summary cards:
- Total views (large number)
- Published articles count
- Optional link button: "Open GA4 console" (external)

Status breakdown row (pill chips or mini stat cards):
- Published: 12 | Draft: 3 | Scheduled: 1 | Archived: 2

"Top articles" table:
- Title | Views | Published date
- 5–8 rows with realistic view counts

Optional chart (aspirational): simple 7-day views line chart in burgundy — keep minimal

States: Loading spinner | Empty "No view data yet"

---

## Interaction & content guidelines

- Use realistic editorial copy (film reviews, TV recaps, opinion pieces) — not lorem ipsum
- One admin user only — no user management screens in v1
- Mobile: show collapsed sidebar (hamburger) + stacked single-column forms; tables become card lists
- Accessibility: visible focus rings (burgundy), field labels always visible, error text in red under fields
- Do NOT design Payload Studio — this is Kiribé-branded custom admin only
- Keep admin visually related to public V5 (burgundy/gold/cream) but more utilitarian: fewer hero photos, more whitespace, clearer hierarchy

## Deliverables

1. Admin design system frame (buttons, inputs, badges, toast, table, empty/error states)
2. All 12 screens above as separate frames
3. Key component variants: login states, media picker modal, article editor (new + edit), toast success/error overlay on one screen
4. Desktop 1440px primary; one mobile 390px frame for login + article editor
5. Name frames clearly: Admin / 01 Login, Admin / 02 Dashboard, etc.

Build on the existing Kiribé V5 public design language already in this file. Admin should feel like the same brand running a professional editorial back office.
```

---

## Follow-up prompts

Run these in Figma Make after the main prompt generates the first pass.

### Follow-up 1 — Toast overlays

```
On the existing Kiribé Admin frames, add toast/snackbar overlay variants:

1. Article Editor (Edit article) — success toast top-center: title "Article saved", description "Your changes are live on the site.", green filled alert, close X
2. Article Editor — error toast: title "Request failed", description "Title is required", red filled alert
3. Media picker Upload tab — success toast: title "Image uploaded", description "Your request was submitted."
4. Homepage builder — success toast: title "Homepage updated"
5. Settings — success toast: title "Success", description "Your request was submitted."

Match burgundy/cream admin shell. Toasts sit above content, auto-dismiss ~5s. Show one frame per toast state as a variant group.
```

### Follow-up 2 — Mobile frames

```
Create mobile 390px width frames for Kiribé Admin:

1. Admin / 01 Login — Mobile: full-width card, same dark backdrop
2. Admin / 02 Dashboard — Mobile: hamburger menu icon, stacked stat cards 2×2
3. Admin / 04 Article Editor — Mobile: single column, sidebar fields stack below body
4. Admin / 06 Media library — Mobile: 2-column image grid

Collapsed sidebar (drawer overlay on hamburger tap). Keep burgundy #6B1D2A, cream #FAF8F5, Outfit + Open Sans.
```

### Follow-up 3 — Prototype flow

```
Wire a clickable prototype for the Kiribé Admin publish flow:

Login (Sign in) → Dashboard → New article → Choose image (Media picker modal, Library tab) → Save → Articles list

Use existing Admin frames. Hotspots: Sign in button, New article buttons, Choose image, Save, toast dismiss optional. Name flow "Publish article happy path".
```

---

## Review checklist

Use this after Figma Make generates frames. Each row maps to [`AdminRoutes`](src/routes/admin.routes.ts) and CMS fields.

| Frame | Route | Required UI | CMS / API fields | Reference frame |
|-------|-------|-------------|------------------|-----------------|
| 01 Login | `/admin/login` | Email, password, Sign in, inline error, loading | `POST /api/admin/auth/login` | Pass — Default, Error, Loading variants |
| 02 Dashboard | `/admin/dashboard` | Stat cards: Published, Drafts, Scheduled, Media; New article; Homepage builder | `/api/admin/dashboard` | Pass |
| 03 Articles | `/admin/articles` | Table: title, status, views, edit; New article | Article list API | Pass — sample editorial rows |
| 04 Article editor | `/admin/articles/new`, `/:id/edit` | Title, excerpt, body, status, publish date, hero, categories, tags, Save/Cancel | Articles collection + SEO group | Pass — two-column layout + toast overlay |
| 05 Media picker | Modal | Library/Upload tabs, alt text required, 96px preview | Media collection | Pass — Library tab grid |
| 06 Media library | `/admin/media` | Upload, grid, alt/filename | JPEG/PNG/WebP/GIF | Pass — 8-tile grid |
| 07 Homepage | `/admin/homepage` | Hero article, category modules, layouts, Save | Homepage global | Pass — module summary |
| 08 Editor's Picks | `/admin/editors-picks` | Up to 5 picks, Add pick, Save | Homepage global `editorsPicks` | Pass |
| 09 Categories | `/admin/categories` | Name create + table | Categories: name, slug, description, displayOrder | Pass |
| 10 Tags | `/admin/tags` | Name create + table | Tags: name, slug | Pass |
| 11 Settings | `/admin/settings` | Site name, SEO description, Save | SiteSettings global | Pass |
| 12 Analytics | `/admin/analytics` | Total views, status breakdown, top articles, GA4 link | `/api/admin/analytics` | Pass |
| Design system | — | Buttons, inputs, badges, toast, empty/error | MUI theme tokens | Pass — `Admin / 00 Design System` |
| Mobile | 390px | Login, editor | Responsive AdminShell | Pass — Login + Article editor mobile |
| Toasts | Overlays | Success/error on save, upload | KiribeSnackbar top-center | Pass — Article saved, Request failed, Image uploaded |
| Prototype | — | Login → publish happy path | — | Pass — flow annotation frame |

### Fields in CMS not yet in current React UI (design should include)

These are in Payload but not fully wired in admin pages yet — Figma should show them so implementation can follow:

- Article: SEO title, description, OG image; featured checkbox; featured priority; slug (read-only)
- Category: description, display order in list
- Settings: logo, social links repeater, default SEO title, default OG image
- Media: caption, credit, usage count, detail drawer
- Homepage modules: enabled toggle, manual article picks, sort order drag

### Brand token verification

| Token | Hex | Used in admin |
|-------|-----|---------------|
| Burgundy | `#7F0400` (admin CMS) / `#6B1D2A` (public) | Admin CTAs use `#7F0400`; public site uses `#6B1D2A` |
| Burgundy dark / accent hover | `#E6A313` (admin primary hover) | Mustard accent on admin button hover |
| Mustard | `#C9A227` / `#E6A313` | Accent underlines; admin accent token `#E6A313` |
| Cream | `#FAF8F5` | Page background |
| Ink | `#1A1A1A` | Headlines |
| Muted | `#6B7280` | Labels, metadata |
| Archive hero | `#1C1214` | Login backdrop only |

---

## Code references

| Area | Path |
|------|------|
| Routes | `src/routes/admin.routes.ts` |
| Shell | `src/modules/admin/components/AdminShell/AdminShell.tsx` |
| Toast | `src/modules/shared/components/feedback/KiribeSnackbar/KiribeSnackbar.tsx` |
| Media picker | `src/modules/admin/components/MediaPicker/MediaPicker.tsx` |
| MUI theme | `src/theme/muiTheme.ts` |
| Articles schema | `src/payload/collections/Articles.ts` |
| Homepage schema | `src/payload/globals/Homepage.ts` |
| Site settings | `src/payload/globals/SiteSettings.ts` |

# PLAN — SEO + Open Graph Audit & Uplift

Audit taken 2026-07-24 against the live tree. Goal: every public URL has
correct metadata, correct social preview, correct structured data, is
indexed appropriately, and is discoverable via sitemap.

---

## Current state (what's already good)

- **Root layout** wires `generateMetadata` (`src/app/layout.tsx`) with the
  title template, description, `metadataBase`, RSS alternate, OG + Twitter
  defaults from `SiteSettings.seoDefaults` (editor-editable, cached).
- **Article detail** has full `generateMetadata` with `type: article`,
  `publishedTime`, `authors`, canonical, twitter card. The co-located
  `opengraph-image.tsx` implements the 3-tier fallback: `seo.ogImage` →
  `heroImage` → branded card with category accent.
- **Category detail** metadata includes special-cased copy for `spotlight`
  and `videos`, canonical, OG.
- **Tag detail**, **Articles list**, **Categories index**, **Search**,
  **About**, **Contact**, **Privacy**, **Terms** all have `metadata` /
  `generateMetadata`, canonical, OG.
- **`robots.txt`** disallows `/admin`, `/payload-studio`, `/api/`, points
  at the sitemap.
- **Sitemap** (`/sitemap.xml`) includes static marketing routes + every
  published article (up to 1000, cached hourly, tag-invalidated).

## Gaps

### Discoverability
- **G1** `sitemap.ts` is missing individual category pages
  (`/categories/[slug]`), tag pages (`/tags/[slug]`), spotlight, videos.
- **G2** No `not-found.tsx` at `src/app/(site)/` — 404s render Next's
  default page with no branded metadata.
- **G3** Search page (`/search`) is indexable — search-result pages
  should be `robots: { index: false, follow: true }` to avoid thin-content
  penalties.

### Structured data
- **G4** No JSON-LD anywhere. Google and Bing lean heavily on schema for
  Discover, sitelinks, and article rich results.
  - Home: `Organization` + `WebSite` (with `SearchAction` for sitelinks
    searchbox)
  - Article: `NewsArticle` (headline, image, datePublished, dateModified,
    author, publisher, mainEntityOfPage)
  - Category / Tag / Videos / Spotlight: `CollectionPage` +
    `BreadcrumbList`
  - Static (About, Contact, Privacy, Terms): `WebPage` +
    `BreadcrumbList`

### Article metadata completeness
- **G5** `openGraph.article` missing `section` (primary category), `tags`,
  `modifiedTime` (from `updatedAt`).
- **G6** No explicit `openGraph.images` declaration — the co-located
  `opengraph-image.tsx` wins, but declaring lets non-file-aware scrapers
  pick it up.
- **G7** No `keywords` — Google ignores, but Bing and internal search
  crawlers still use it.
- **G8** No `twitter.creator` handle when an author has a Twitter handle
  configured on their user record. Requires a `twitterHandle` field on
  Users; today there is none.

### OG image parity
- **G9** Only articles have a dynamic OG image. These render a generic
  "Kiribé Online" default when shared:
  - Homepage (`/`)
  - Categories index (`/categories`) and each `/categories/[slug]` incl.
    `videos`, `spotlight`
  - Tags (`/tags/[slug]`)
  - Search (`/search`) — arguably fine, not shared
  - About / Contact / Privacy / Terms

### Cross-cutting
- **G10** No search-engine verification meta tags (Google Search Console,
  Bing Webmaster). Env-driven addition (`GOOGLE_SITE_VERIFICATION`,
  `BING_SITE_VERIFICATION`).
- **G11** Homepage inherits root metadata but has no explicit `canonical`
  or a homepage-tailored description that beats the site-wide default.
- **G12** No systematic OG image alt-text pass. `opengraph-image.tsx`
  exports `alt` but it's a generic string ("Kiribé Online — article
  social card"). Should include the article title.

---

## Phased plan

### Phase 1 — Discoverability + structured data (highest search impact)

Small, low-risk edits with concrete Search Console upside.

- **P1.1** Extend `getSitemapEntries()` (`src/services/cron.service.ts`)
  to include all published categories, tags, plus explicit `/categories/spotlight`
  and `/categories/videos`. (G1)
- **P1.2** Add `src/app/(site)/not-found.tsx` — branded 404 with
  `metadata: { title, robots: { index: false } }`. (G2)
- **P1.3** Add `robots: { index: false, follow: true }` to search page
  `generateMetadata`. (G3)
- **P1.4** New helper `src/lib/seo/json-ld.tsx` — small utility that
  emits a `<script type="application/ld+json">` with correct escaping.
- **P1.5** Wire JSON-LD:
  - Root layout: `Organization` + `WebSite` (base for all pages).
  - Article detail page: `NewsArticle` schema. (G4)
  - Category / tag / videos / spotlight archive pages: `CollectionPage`
    + `BreadcrumbList`.
  - Static pages: `BreadcrumbList` (WebPage is redundant with root).
- **P1.6** Complete article metadata: `openGraph.section`,
  `openGraph.tags`, `openGraph.modifiedTime`, explicit
  `openGraph.images: [{ url: canonical/opengraph-image, width, height, alt }]`.
  (G5, G6, G12)

### Phase 2 — OG image parity across routes

Every publicly shareable URL gets a branded card by default.

- **P2.1** Extract the branded-card renderer from
  `articles/[slug]/opengraph-image.tsx` into a shared
  `src/lib/seo/branded-og-card.tsx` (accepts `kicker`, `title`,
  `accentColor`, optional heroImage URL).
- **P2.2** New `src/app/(site)/opengraph-image.tsx` — homepage-level OG
  using the current hero article's image if available, else branded
  fallback. (G9)
- **P2.3** New `src/app/(site)/categories/opengraph-image.tsx` — branded
  "All Categories" card.
- **P2.4** New `src/app/(site)/categories/[slug]/opengraph-image.tsx` —
  3-tier: category `spotlightImage` (if added) → aggregate of latest
  article hero → branded card with category accent color. Includes
  special-cased copy for `spotlight` + `videos`.
- **P2.5** New `src/app/(site)/tags/[slug]/opengraph-image.tsx` — branded
  card with tag name (no per-tag artwork).
- **P2.6** New `src/app/(site)/about/opengraph-image.tsx` — branded
  "About Kiribé" card. Contact / Privacy / Terms inherit root default.

### Phase 3 — Governance + observability

Small polish + one dev tool.

- **P3.1** Env-driven verification tags in root layout: `googleSiteVerification`
  + `bing` under `metadata.verification`. (G10)
- **P3.2** Add explicit `alternates: { canonical: "/" }` and a
  homepage-tailored description to the root's homepage. (G11)
- **P3.3** Extend `PublishChecklist` items to warn (soft-fail, not
  hard-fail) when `seo.ogImage` is missing and the hero image lacks alt
  text — the article editor already has a checklist; expand its scope.
- **P3.4** New optional dev script `scripts/seo-audit.mjs` — walks the
  local dev server for all known routes, checks `<meta>` tag presence,
  reports missing canonical / og / twitter / json-ld. Manual, not CI.
- **P3.5** Add `twitterHandle` to Users collection so future
  `twitter.creator` wiring in article metadata has a source. (G8)
  Optional — skip if v1 team stays anonymous.

### Phase 4 — Nice to have (defer unless asked)

- **P4.1** Sitelinks searchbox JSON-LD wired into homepage `WebSite`
  schema so `site:kiribeonline.com foo` search sidebar shows a search
  box.
- **P4.2** RSS `<atom:link>` self-reference in the feed XML (feed
  hygiene).
- **P4.3** OG video tag on `/categories/videos` — some scrapers pick up
  the embed URL.

---

## Verification plan (after each phase)

1. `npm run build` — no metadata build errors.
2. **Facebook Sharing Debugger** on the deployed URL for each new OG:
   home, /articles/{slug}, /categories/film, /categories/videos,
   /tags/{slug}, /about. Confirm og:image, og:type, og:title populate.
3. **Twitter Card Validator** — same URLs. Confirm summary_large_image.
4. **Google Rich Results Test** — /articles/{slug} shows
   NewsArticle schema; category pages show BreadcrumbList.
5. **`site:kiribeonline.com`** in Google after a re-crawl — expect
   category + tag pages to start appearing (Phase 1 sitemap add).
6. **`curl -sI https://kiribeonline.com/sitemap.xml`** returns the full
   list including categories + tags.
7. **`/robots.txt`** unchanged apart from sitemap URL.

## Non-goals

- Multi-language SEO (`hreflang`) — English only per CLAUDE.md.
- AMP — deprecated.
- Turning on Google Discover — that's a submission process, not a code
  change; we prep the schema and let it run.

---

Priority: **Phase 1 first** — the sitemap gaps and missing JSON-LD are
the biggest search-visibility wins, and the work is contained. Phase 2
is more visible on social shares. Phase 3 is polish. Phase 4 is defer.

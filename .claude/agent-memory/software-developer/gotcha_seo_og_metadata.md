---
name: gotcha-seo-og-metadata
description: Next.js metadata precedence + build-without-DB gotchas hit while adding OG images/sitemap
metadata:
  type: project
---

Two non-obvious traps when adding SEO/OG metadata (from PLAN-EMBEDS Step 5, branch `feat/seo-og-metadata`):

**1. File-based `opengraph-image.tsx` overrides `generateMetadata` `openGraph.images`.**
Confirmed authoritative in Next 15 docs ("File-based metadata has the higher priority and will override the metadata object and generateMetadata function"). So you cannot resolve an OG image chain in `generateMetadata.images` if a co-located `opengraph-image.tsx` exists — the file always wins for `og:image`.
- **How to apply:** put the whole fallback chain (seo.ogImage → hero → branded card) *inside* `opengraph-image.tsx`. Don't set `openGraph.images` in `generateMetadata`. For real media tiers, `Response.redirect(absoluteUrl, 307)` to the hosted og-size media. Twitter inherits via og:image fallback, so `twitter.card` needs no separate image.

**2. A `sitemap.ts` with `revalidate` (ISR/static) prerenders at build and needs a live DB — this worktree has none.**
The DB failure surfaced as an async pg-pool rejection that a `try/catch` around `payload.find` did NOT catch (it still crashed the build worker). Other public queries (getHomepageForPublic, getCategoriesForPublic) survive the DB-less build only because their routes are dynamic, not because of their try/catch.
- **How to apply:** any new route that reads Payload/Neon and would otherwise be statically prerendered must be `export const dynamic = "force-dynamic"` to keep the build green without a DB. To still cache, wrap the data fn in `unstable_cache` (Data Cache is independent of route render mode) rather than relying on route `revalidate`.

**Env:** this repo's public origin var is `NEXT_PUBLIC_APP_URL` (not `NEXT_PUBLIC_SITE_URL` as the plan drafted). `src/lib/seo/site-url.ts` centralizes `getSiteBaseUrl`/`toAbsoluteUrl`.

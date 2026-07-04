# Plan — Article Embeds, Rich Content & Social Metadata

Status: DRAFT (from 2026-07-04 review, findings E1–E5)
Touches: `src/modules/admin/components/AdminRichTextEditor/`,
`src/modules/shared/components/feedback/RichTextRenderer/`,
`src/lib/reels/parse-embed.ts` (promote to `src/lib/embeds/`),
`src/app/(site)/articles/[slug]/page.tsx`, `src/app/layout.tsx`

## Goals

Editors can drop video/social embeds, pull quotes, and galleries into article
bodies; shared article links render a proper social card. Everything sanitized via
host allow-lists and click-to-load iframes.

## Step 1 — Promote the Reels embed parser (E1 groundwork)

Move `src/lib/reels/parse-embed.ts` → `src/lib/embeds/parse-embed.ts` (keep a
re-export for Reels callers). Extend:

- Existing: YouTube, Instagram, TikTok (host allow-list + `safeUrl` stays the
  sanitization seam).
- Add: Vimeo, X/Twitter (via `platform.twitter.com` widget iframe or link-card
  fallback), Spotify (trailers/interviews commonly shared as episodes).
- Unknown URL → typed `link-card` fallback (title = hostname, no iframe ever).

## Step 2 — Custom Lexical nodes in the admin editor (E1)

`AdminRichTextEditor` gains three nodes + toolbar buttons:

1. **EmbedNode** `{ url, platform, embedUrl }` — insert dialog takes a pasted URL,
   runs `parseEmbed`, rejects un-allow-listed hosts with inline error. Editor
   preview renders a static card (platform badge + URL), not a live iframe.
2. **PullQuoteNode** `{ quote, attribution }` — distinct from blockquote; renders
   in the brand style (burgundy rule, Outfit display, mustard attribution).
3. **GalleryNode** `{ items: mediaId[] }` — multi-select via the existing
   `MediaPicker`; ordered list with drag-to-reorder.

Serialize as standard Lexical JSON custom nodes so the article `body` field needs
no schema change. Register the same node classes wherever the JSON is loaded.

Payload side: also register matching features/converters if Payload Studio is ever
used for body editing; for v1 the custom admin is the only editor (per CLAUDE.md),
so the authoritative implementation lives there. Note the E5 caveat in code.

## Step 3 — Public renderers (E1, E4)

`RichTextRenderer` passes custom `converters` to `<RichText>`:

- `embed` → `<ArticleEmbed>`: click-to-activate iframe reusing the `VideoReelCard`
  pattern (poster + play affordance, iframe only after click; `loading="lazy"`,
  `sandbox`, `allow` minimal). Never render an iframe for a host not in the
  allow-list — re-validate server-side at render, don't trust stored `embedUrl`.
- `pullquote` → branded component in `src/modules/editorial/components/`.
- `gallery` → grid + existing `KiribeImageViewer` lightbox, images via
  `KiribeImage` (depends on PLAN-IMAGES Phase D converter work — build together).
- Unknown node types → render nothing but `console.warn` in dev (E4 guard).

## Step 4 — Link sanitization (E3) — ship first, standalone

In the link dialog (`AdminRichTextEditor.tsx:676-717`): allow only `https:`,
`http:`, `mailto:` schemes; strip anything else on save. Belt-and-braces: the
public `RichTextRenderer` link converter drops non-allow-listed schemes too, and
adds `rel="noopener noreferrer"` + `target="_blank"` for external hosts.

## Step 5 — Social metadata & OG images (E2) — ship first, standalone

`src/app/(site)/articles/[slug]/page.tsx` `generateMetadata`:

```ts
openGraph: {
  title, description, type: "article",
  publishedTime: article.publishedAt,
  images: [ogImageUrl],            // seo.ogImage → hero image → dynamic fallback
},
twitter: { card: "summary_large_image", title, description, images: [ogImageUrl] },
```

- `src/app/layout.tsx`: add `metadataBase` from `NEXT_PUBLIC_SITE_URL` (add to
  `.env.example`), plus default `openGraph` site name and images.
- Dynamic fallback: `src/app/(site)/articles/[slug]/opengraph-image.tsx` with
  `next/og` `ImageResponse` — cream background, burgundy wordmark, article title in
  Outfit, category accent bar. Used when an article has neither `seo.ogImage` nor
  hero.
- Use the `og` size variant from PLAN-IMAGES (1200×630) for media-based OG images.
- While in here: also do category/tag/archive metadata (IMPLEMENTATION Phase 4
  "SEO metadata on all public routes").

## Suggested order

1. Step 4 + Step 5 (small, independent, immediate SEO/security value).
2. Step 1 + Step 2 + Step 3 as one feature branch (embed pipeline end-to-end).

## Acceptance criteria

- Pasting a YouTube/Instagram/TikTok/Vimeo URL inserts an embed; a random host is
  rejected with a visible message.
- Published article shows click-to-load embeds; no third-party network requests
  until interaction.
- `javascript:alert(1)` in the link dialog is rejected; existing stored links are
  neutralized at render.
- Sharing an article on X/WhatsApp/Slack shows title, description, and image for
  all three OG-image fallback tiers.
- Articles without embeds render exactly as before (regression check on serializer).

## Review gates

`code-reviewer` mandatory (user-content rendering, iframes — XSS focus). Update
IMPLEMENTATION §2.3 and Phase 4 SEO items; note the new editor capability in
`docs/DESIGN.md` article-detail section.

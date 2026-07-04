# Plan — Image Upload & Handling Pipeline

Status: DRAFT (from 2026-07-04 review, findings I1–I9)
Touches: `src/payload/collections/Media.ts`, `src/payload.config.ts`, `next.config.ts`,
`src/app/api/admin/media/route.ts`, `src/modules/admin/components/MediaPicker/`,
`src/modules/shared/components/media/KiribeImage/`,
`src/modules/shared/components/feedback/RichTextRenderer/`

## Goals

Every image on the site ships at the right size and format, uploads are bounded and
validated, and images load with a blur-up placeholder for a premium feel.

## Phase A — Media collection variants (I1, I6, I7)

In `src/payload/collections/Media.ts` `upload` config:

```ts
upload: {
  staticDir: "media",
  mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  focalPoint: true,
  crop: true,
  formatOptions: { format: "webp", options: { quality: 82 } },
  resizeOptions: { width: 2560, height: 2560, fit: "inside", withoutEnlargement: true },
  imageSizes: [
    { name: "thumb",  width: 320,  height: 240,  fit: "cover" },          // admin grid, list thumbs (4:3)
    { name: "card",   width: 640,  height: 400,  fit: "cover" },          // article cards (16:10)
    { name: "hero",   width: 1440, height: 900,  fit: "cover" },          // hero / detail (16:10)
    { name: "og",     width: 1200, height: 630,  fit: "cover" },          // social sharing
  ],
},
```

- GIFs: skip `formatOptions` conversion for `image/gif` (animated) — gate via
  Payload's per-size `formatOptions` or accept originals for GIF.
- Add a `beforeChange` hook that generates a ~16px-wide base64 LQIP with `sharp`
  into a new `blurDataUrl` text field (used by Phase D).
- Migration: regenerate sizes for existing media with `payload` local API script in
  `scripts/` (repo has few/no production images yet, so cost is low — do it now).

## Phase B — Server-side upload validation (I3, I9)

`src/app/api/admin/media/route.ts` POST:

- Reject `file.size > MAX_UPLOAD_BYTES` (add `MAX_UPLOAD_BYTES = 10 * 1024 * 1024`
  to `src/constants/app.constants.ts` — never hardcode in the route).
- Re-check MIME against the same whitelist server-side (don't rely on collection
  config alone); verify magic bytes if cheap (`file-type` or sharp metadata probe).
- Rate limit: `rateLimitForEndpoint("admin_media_upload", ip, 30, RATE_LIMIT_WINDOW_MS)`
  (also covered by PLAN-RATE-LIMITING R5).
- Also set Payload global upload limits in `payload.config.ts`:
  `upload: { limits: { fileSize: MAX_UPLOAD_BYTES } }` so the Payload REST surface
  is bounded too.
- Startup guard: in `payload.config.ts`, if `NODE_ENV === "production"` and R2 env
  is incomplete or `R2_PUBLIC_URL` unset, `throw` instead of silently using local disk.

## Phase C — MediaPicker upgrades (I6, I3 client side)

`src/modules/admin/components/MediaPicker/MediaPicker.tsx`:

- Client-side downscale before upload: canvas `createImageBitmap` → resize longest
  edge to 2560 → `toBlob("image/webp", 0.85)` for JPEG/PNG inputs (skip GIF/WebP).
  No new dependency needed.
- Pre-flight size check with a friendly toast (`KiribeSnackbar`) instead of a 413.
- Drag-and-drop zone on the Upload tab + selected-file preview with dimensions.
- Show caption/credit fields (already in the collection; FIGMA-ADMIN-PROMPT lists
  them as not yet wired).

## Phase D — Rendering (I2, I4, I5)

1. **`next.config.ts`**:
   - Add the `R2_PUBLIC_URL` hostname to `remotePatterns` (derive from env at config
     time); remove the over-broad `*.cloudflare.com` wildcard.
   - `images: { formats: ["image/avif", "image/webp"], minimumCacheTTL: 86400 }`.
2. **`KiribeImage`**: accept the media doc (not just URL) and pick the right size
   variant per aspect (`thumb`/`card`/`hero`); pass `placeholder="blur"` +
   `blurDataURL` when the doc has `blurDataUrl`.
3. **`RichTextRenderer`** (fixes body `<img>`): pass custom `converters` to
   `<RichText>` so `upload` nodes render through `KiribeImage` (lazy, sized,
   blurred, alt from media doc). This is also the seam PLAN-EMBEDS builds on.
4. Hero images keep `priority`; everything else lazy.

## Phase E — Deletion guard (I8)

`DELETE /api/admin/media/[id]`: before delete, query articles/homepage/reels/creators
for references (or trust `usageCount` once it's actually incremented by hooks — verify
it is; if not, add `afterChange` hooks on referencing collections). If referenced,
return 409 with the referencing article titles; admin UI shows them in the confirm
dialog.

## Acceptance criteria

- Uploading a 25 MB JPEG fails client-side with a toast and server-side with 413.
- Uploaded JPEG is stored as WebP ≤2560px with 4 size variants + `blurDataUrl`.
- Article body images render via `next/image` with lazy loading and blur-up.
- Lighthouse image audits (properly sized, next-gen formats) pass on homepage and
  article detail.
- Deleting an in-use image is blocked with a clear message.
- Production boot fails loudly if R2 is misconfigured.

## Review gates

`code-reviewer` mandatory (uploads). Update `docs/IMPLEMENTATION.md` Phase 4 "Image
optimization pipeline" and TRD §13 "Secure file upload validation" when done.

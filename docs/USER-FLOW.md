# Kiribe Online — User Flow

## What this product does

Kiribe Online is a premium magazine-style website for film, TV, video, opinion, news, and spotlight content. Visitors read and browse stories. One admin publishes and manages everything from a single dashboard.

## Who it's for

- **Readers** who want polished editorial content on any device
- **The Kiribe admin** who publishes articles without developer help

## Main journeys

### 1. Read a featured story

1. Open the homepage
2. Tap the lead featured story
3. Read the full article with images
4. Browse related stories at the bottom

### 2. Browse the archive

1. Go to **Articles**
2. Search or scroll the list
3. Switch between list and tile view
4. Open any article

### 3. Browse by category or tag

1. Open **Categories** or tap a tag on an article
2. See filtered stories
3. Open an article from the grid

### 4. Subscribe

1. Tap **Subscribe** in the nav or a CTA
2. Enter email
3. See confirmation (no payment in v1)

### 5. Contact

1. Go to **Contact** or the About page contact section
2. Fill name, email, message
3. Submit and see success or error

### 6. Offline reading

1. Lose connection while browsing
2. See a branded offline message
3. Retry or read cached articles if available

### 7. Admin publishes an article

1. Log in at `/admin/login` (Kiribe-branded UI, not Payload Studio)
2. Create or edit an article from `/admin/articles`
3. Add hero image, categories, tags, body, SEO fields
4. Configure homepage hero, Editor's Picks, and category section layouts at `/admin/homepage`
5. Schedule or publish
6. Story appears on the public site; views tracked via `/api/analytics/view`

## Pages map

| Page | Purpose |
|------|---------|
| Home | Featured stories and discovery |
| Articles | Full archive |
| Article detail | Single story |
| Categories / Tags | Filtered browsing |
| About | Brand story + contact |
| Contact | Message form |
| Subscribe | Email signup |
| Offline | Branded fallback when offline |
| Privacy / Terms | Legal |
| Admin dashboard | Custom Kiribe admin — articles, media, homepage, settings, analytics |

## Roles

| Role | Can do |
|------|--------|
| Visitor | Read, browse, search, subscribe, contact |
| Admin | All content, media, settings, featured placement |
| System | Auth, cache, audit logs, rate limits |

## FAQ

1. **Can visitors comment?** No, not in v1.
2. **Is there a paywall?** No subscription billing in v1.
3. **How many admins?** One admin account in v1.
4. **Does it work offline?** Partially — cached pages and a branded offline state.
5. **Where are images stored?** Cloudflare R2.
6. **Can we add Film/TV/News top-level sections later?** Yes, but not in v1.
7. **What happens when a post goes viral?** Caching and edge protection handle spikes.
8. **How do I update the homepage featured stories?** Admin → Featured content.
9. **Is the site mobile-friendly?** Yes, mobile-first.
10. **What if I forget my admin password?** Ask an admin to re-invite you (the invite flow sets a new password on accept). No self-service reset in v1 — see `docs/DECISIONS.md`.

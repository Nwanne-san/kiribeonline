# QA expert memory — Kiribe Online

## Environments

- Local: `npm run dev` → http://localhost:3000
- Admin login: `/admin/login` (scaffold)

## Smoke test (foundation)

1. Homepage loads with Kiribe branding
2. Nav links: Articles, About, Contact, Subscribe
3. `/offline` shows branded offline UI + Retry
4. `/admin/dashboard` redirects to login without cookie
5. Mobile viewport: header readable, no horizontal scroll

## Phase 2 test areas

- Article publish → appears on homepage/archive
- Contact form validation + rate limit
- Subscribe confirmation
- Category/tag filters
- Related articles on detail page

## Browser matrix

- Chrome (desktop + mobile emulation)
- Safari iOS (layout and fonts)

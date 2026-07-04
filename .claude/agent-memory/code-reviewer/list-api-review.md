# List API review checklist

## Rate limits

- [ ] `/api/articles` — `ARTICLES_RATE_LIMIT` per IP per minute
- [ ] `/api/search` — `SEARCH_RATE_LIMIT` per IP per minute
- [ ] 429 response on exceed

## Input validation

- [ ] `clampLimit()` on all list endpoints
- [ ] `parsePage()` — minimum 1
- [ ] Search rejects `q` shorter than `MIN_SEARCH_LENGTH`

## Injection / abuse

- [ ] Search uses Payload `contains`, not raw SQL
- [ ] Filter JSON parsed safely (try/catch, empty fallback)
- [ ] No unbounded `limit` from client

## Cache

- [ ] Route `revalidate` from `LIST_REVALIDATE_SECONDS`
- [ ] `revalidateTag('articles')` on publish

## Client

- [ ] Query keys stable (filter fingerprint, not object identity)
- [ ] Page resets to 1 on filter/search/view change

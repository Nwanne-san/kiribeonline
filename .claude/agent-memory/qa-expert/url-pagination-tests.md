# URL pagination manual QA

## Archive `/articles`

1. Open `/articles?page=2` — second page loads; URL unchanged on refresh
2. Change rows per page — URL updates `limit`; page resets to 1
3. Toggle view grid/list/feed — URL updates `view`
4. Type in search — after debounce, `?q=` appears; page resets to 1
5. Browser back from page 2 → page 1

## Feed mode

1. `/articles?view=feed` — infinite scroll or Load more fetches next page
2. Pagination footer hidden in feed mode

## Search `/search`

1. Empty `/search` — prompt or empty state
2. `/search?q=ab` with 2+ chars — results or empty state
3. Single char — validation message, no API call

## Category / tag

1. `/categories/film` — only film category articles
2. `/tags/spotlight` — only tagged articles

## Article detail

1. `/articles/:slug?modal=image` — lightbox opens
2. Close modal — `modal` param removed from URL

## API / cache

1. Burst `/api/search` — 429 after limit
2. Publish article in admin — public list updates within revalidate window

## Slow network

1. Throttle to Slow 3G — page change shows previous data until new page loads

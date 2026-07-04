# URL state and pagination contract

## URL parameters

| Param | Values | Hook |
|-------|--------|------|
| `page` | 1-based integer | `usePagination` |
| `limit` | 12, 24, 48 (clamped to `MAX_PAGE_LIMIT`) | `usePagination` |
| `q` | search string | `useDebouncedUrlParam` |
| `view` | `grid`, `list`, `feed` | `useListViewMode` |
| `filter` | URL-encoded JSON `{ category?, tag? }` | `useFilter` |
| `modal` | e.g. `image` on article detail | `useModalRoute` |

## Payload mapping

- `filter.category` → `where.categories.slug equals`
- `filter.tag` → `where.tags.slug equals`
- `q` → `or` contains on `title`, `excerpt`
- Always filter `status: published` for public reads

## API routes

- `GET /api/articles` — list with filters
- `GET /api/search` — requires `q` min `MIN_SEARCH_LENGTH`

Server clamps `limit` via `clampLimit()` from `@/constants`.

## Constants

Single source: `src/constants/app.constants.ts`

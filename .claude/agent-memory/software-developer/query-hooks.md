# Query hooks — editorial lists

## When to use which hook

| Hook | Use case |
|------|----------|
| `useQueryService` | Paginated lists (`view` = grid or list) |
| `useInfiniteQueryService` | Feed / infinite scroll (`view` = feed) |
| `useArticlesList` | Editorial pages — composes URL hooks + correct query hook |

## Query keys

Include: `editorialQueryKeys.*`, `service.path`, `service.data`, `filterFingerprint`, `q`

## Options

- Paginated lists: `keepPreviousData: true`, `staleTime: LIST_STALE_TIME_MS`
- Search: `staleTime: SEARCH_STALE_TIME_MS` (0)
- Both: `retry: QUERY_RETRY_COUNT`

## Response shape

App routes return `{ success, data: ArticleListResult }`. Hooks unwrap via `unwrapApiData`.

## Merge infinite pages

`mergeInfinitePages(pages)` from `@/lib/content/merge-pages`

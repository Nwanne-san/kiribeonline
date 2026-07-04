# Editorial module

Homepage, articles, archive, category/tag pages, search, and article detail.

## Add here

- `pages/` — HomePage, ArticlesPage, ArticleDetailPage, CategoryArchivePage
- `components/` — ArticleCard, FeaturedHero, RelatedArticles, ArchiveToggle
- `hooks/` — useArticles, useFeaturedStories

## Data

Prefer `getPayloadClient()` in Server Components. Client search may use `src/services/content.service.ts`.

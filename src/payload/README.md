# Payload CMS layer

Schema and access control only. No React components.

- `collections/` — database models
- `globals/` — singleton config (site settings)
- `fields/` — reusable field definitions
- `access/` — read/write rules

Config entry: `src/payload.config.ts`

After schema changes:

```bash
npm run generate:types
npm run generate:importmap
```

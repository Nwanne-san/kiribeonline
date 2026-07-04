import { ApiMethods } from "../../types/service";

/** Payload REST API paths — use with server-side fetch or Local API instead when possible. */
export const contentEndpoints = {
  articles: {
    list: { path: "/api/articles", method: ApiMethods.GET },
    bySlug: { path: "/api/articles", method: ApiMethods.GET },
  },
  categories: {
    list: { path: "/api/categories", method: ApiMethods.GET },
  },
  tags: {
    list: { path: "/api/tags", method: ApiMethods.GET },
  },
} as const;

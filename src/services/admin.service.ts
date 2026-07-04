import { ApiMethods } from "../../types/service";

const ADMIN_API = "/api/admin";

export const adminAuthService = {
  login: { path: `${ADMIN_API}/auth/login`, method: ApiMethods.POST },
  logout: { path: `${ADMIN_API}/auth/logout`, method: ApiMethods.POST },
};

export const adminDashboardService = {
  get: { path: `${ADMIN_API}/dashboard`, method: ApiMethods.GET },
};

export const adminAnalyticsService = {
  get: { path: `${ADMIN_API}/analytics`, method: ApiMethods.GET },
};

export const adminArticlesService = {
  list: { path: `${ADMIN_API}/articles`, method: ApiMethods.GET },
  create: { path: `${ADMIN_API}/articles`, method: ApiMethods.POST },
  detail: (id: string) => ({ path: `${ADMIN_API}/articles/${id}`, method: ApiMethods.GET }),
  update: (id: string) => ({ path: `${ADMIN_API}/articles/${id}`, method: ApiMethods.PATCH }),
  remove: (id: string) => ({ path: `${ADMIN_API}/articles/${id}`, method: ApiMethods.DELETE }),
};

export const adminCategoriesService = {
  list: { path: `${ADMIN_API}/categories`, method: ApiMethods.GET },
  create: { path: `${ADMIN_API}/categories`, method: ApiMethods.POST },
};

export const adminTagsService = {
  list: { path: `${ADMIN_API}/tags`, method: ApiMethods.GET },
  create: { path: `${ADMIN_API}/tags`, method: ApiMethods.POST },
};

export const adminMediaService = {
  list: { path: `${ADMIN_API}/media`, method: ApiMethods.GET },
  upload: {
    path: `${ADMIN_API}/media`,
    method: ApiMethods.POST,
    options: { isFormData: true },
  },
  remove: (id: string) => ({ path: `${ADMIN_API}/media/${id}`, method: ApiMethods.DELETE }),
};

export const adminHomepageService = {
  get: { path: `${ADMIN_API}/homepage`, method: ApiMethods.GET },
  update: { path: `${ADMIN_API}/homepage`, method: ApiMethods.PATCH },
};

export const adminSettingsService = {
  get: { path: `${ADMIN_API}/settings`, method: ApiMethods.GET },
  update: { path: `${ADMIN_API}/settings`, method: ApiMethods.PATCH },
};

/** Stable React Query key namespaces for admin lists/details. */
export const adminQueryKeys = {
  dashboard: "admin-dashboard",
  analytics: "admin-analytics",
  articles: "admin-articles",
  article: "admin-article",
  categories: "admin-categories",
  tags: "admin-tags",
  media: "admin-media",
  homepage: "admin-homepage",
  settings: "admin-settings",
} as const;

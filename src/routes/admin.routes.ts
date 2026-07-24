/** Custom Kiribe admin routes — primary editor UX (not Payload Studio). */
export enum AdminRoutes {
  home = "/admin",
  login = "/admin/login",
  acceptInvite = "/admin/accept-invite",
  forgotPassword = "/admin/forgot-password",
  resetPassword = "/admin/reset-password",
  dashboard = "/admin/dashboard",
  /**
   * Admin Audit Log. URL is `/admin/recent-activity` for historical reasons
   * (the page shipped as "Recent Activity" first, then grew into the full
   * audit viewer). New code should reference `AdminRoutes.auditLog` below —
   * same URL, greppable name.
   */
  recentActivity = "/admin/recent-activity",
  articles = "/admin/articles",
  articleNew = "/admin/articles/new",
  articleEdit = "/admin/articles/:id/edit",
  homepage = "/admin/homepage",
  editorsPicks = "/admin/homepage/editors-picks",
  media = "/admin/media",
  categories = "/admin/categories",
  tags = "/admin/tags",
  settings = "/admin/settings",
  analytics = "/admin/analytics",
  usersRoles = "/admin/users",
  subscribers = "/admin/subscribers",
  creators = "/admin/creators",
  creatorNew = "/admin/creators/new",
  creatorEdit = "/admin/creators/:id/edit",
  reels = "/admin/reels",
  reelNew = "/admin/reels/new",
  reelEdit = "/admin/reels/:id/edit",
  /** Payload Studio — emergency/dev only when DISABLE_PAYLOAD_STUDIO=false */
  payloadStudio = "/payload-studio",
}

export function adminRoute(
  route: AdminRoutes,
  params?: Record<string, string>
): string {
  let path = route as string;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, encodeURIComponent(value));
    });
  }
  return path;
}

/**
 * Non-enum aliases for the same URLs — kept out of `AdminRoutes` so TypeScript
 * doesn't reject duplicate enum values. New callers should prefer these names.
 */
export const AdminRouteAlias = {
  /** Same URL as `AdminRoutes.recentActivity`; use for grep-ability. */
  auditLog: AdminRoutes.recentActivity,
} as const;

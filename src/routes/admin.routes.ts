/** Custom Kiribe admin routes — primary editor UX (not Payload Studio). */
export enum AdminRoutes {
  login = "/admin/login",
  acceptInvite = "/admin/accept-invite",
  dashboard = "/admin/dashboard",
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

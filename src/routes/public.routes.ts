export enum PublicRoutes {
  home = "/",
  articles = "/articles",
  articleDetail = "/articles/:slug",
  categories = "/categories",
  categoryDetail = "/categories/:slug",
  /** Special-cased categories route — renders the reels grid, not an article archive. */
  categoryVideos = "/categories/videos",
  tags = "/tags",
  tagDetail = "/tags/:slug",
  search = "/search",
  about = "/about",
  contact = "/contact",
  privacy = "/privacy",
  terms = "/terms",
  offline = "/offline",
}

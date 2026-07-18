import type { ComponentType } from "react";
import GridViewOutlined from "@mui/icons-material/GridViewOutlined";
import ArticleOutlined from "@mui/icons-material/ArticleOutlined";
import SellOutlined from "@mui/icons-material/SellOutlined";
import PermMediaOutlined from "@mui/icons-material/PermMediaOutlined";
import LayersOutlined from "@mui/icons-material/LayersOutlined";
import NearMeOutlined from "@mui/icons-material/NearMeOutlined";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import CalendarTodayOutlined from "@mui/icons-material/CalendarTodayOutlined";
import QueryStatsOutlined from "@mui/icons-material/QueryStatsOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import StarOutline from "@mui/icons-material/StarOutline";
import MovieOutlined from "@mui/icons-material/MovieOutlined";
import VideocamOutlined from "@mui/icons-material/VideocamOutlined";
import InsightsOutlined from "@mui/icons-material/InsightsOutlined";
import { AdminRoutes } from "@/routes/admin.routes";

export type NavIcon = ComponentType<{
  fontSize?: "small" | "inherit" | "medium" | "large";
  className?: string;
}>;

export type NavItem = {
  label: string;
  icon: NavIcon;
  /** Target route. Omit for not-yet-built screens (rendered as "Soon"). */
  route?: AdminRoutes;
  /** Extra path prefix that should also mark this item active. */
  matchPrefix?: string;
  /** Not-yet-built screen — shown in the nav but not clickable. */
  soon?: boolean;
};

export type NavGroup = {
  /** Uppercase section label; omitted for the primary group. */
  heading?: string;
  items: NavItem[];
};

/**
 * Admin navigation. The primary group mirrors the Figma sidebar; screens that
 * aren't built yet are flagged `soon` so the chrome matches the design without
 * dead links. The "Content tools" group preserves existing working features
 * that aren't in the Figma redesign yet — final IA is still open.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", icon: GridViewOutlined, route: AdminRoutes.dashboard },
      { label: "Articles", icon: ArticleOutlined, route: AdminRoutes.articles },
      {
        label: "Categories & Tags",
        icon: SellOutlined,
        route: AdminRoutes.categories,
        matchPrefix: "/admin/tags",
      },
      { label: "Media Library", icon: PermMediaOutlined, route: AdminRoutes.media },
      { label: "Pages", icon: LayersOutlined, soon: true },
      { label: "Navigation & Footer", icon: NearMeOutlined, soon: true },
      { label: "Users & Roles", icon: GroupOutlined, route: AdminRoutes.usersRoles },
      { label: "Editorial Calendar", icon: CalendarTodayOutlined, soon: true },
      { label: "SEO", icon: QueryStatsOutlined, soon: true },
      { label: "Settings", icon: SettingsOutlined, route: AdminRoutes.settings },
    ],
  },
  {
    heading: "Content tools",
    items: [
      { label: "Homepage", icon: HomeOutlined, route: AdminRoutes.homepage },
      { label: "Editor's Picks", icon: StarOutline, route: AdminRoutes.editorsPicks },
      { label: "Creators", icon: MovieOutlined, route: AdminRoutes.creators },
      { label: "Reels", icon: VideocamOutlined, route: AdminRoutes.reels },
      { label: "Analytics", icon: InsightsOutlined, route: AdminRoutes.analytics },
    ],
  },
];

/** True when `pathname` should highlight `item`. */
export function isNavActive(item: NavItem, pathname: string): boolean {
  if (!item.route) return false;
  if (pathname === item.route) return true;
  if (pathname.startsWith(`${item.route}/`)) return true;
  if (item.matchPrefix && pathname.startsWith(item.matchPrefix)) return true;
  return false;
}

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
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import StarOutline from "@mui/icons-material/StarOutline";
import MovieOutlined from "@mui/icons-material/MovieOutlined";
import VideocamOutlined from "@mui/icons-material/VideocamOutlined";
import InsightsOutlined from "@mui/icons-material/InsightsOutlined";
import { AdminRouteAlias, AdminRoutes } from "@/routes/admin.routes";
import type { Capability } from "@/server/access/roles";

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
  /**
   * Capability required to see this item. Items without one are visible to
   * every role; gated items are filtered out when the current user lacks the
   * capability so they never click into a 403 screen.
   */
  capability?: Capability;
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
      {
        label: "Dashboard",
        icon: GridViewOutlined,
        route: AdminRoutes.dashboard,
        capability: "analytics:read",
      },
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
      {
        label: "Users & Roles",
        icon: GroupOutlined,
        route: AdminRoutes.usersRoles,
        capability: "users:manage",
      },
      {
        label: "Audit Log",
        icon: HistoryOutlined,
        route: AdminRouteAlias.auditLog,
        capability: "audit:view",
      },
      { label: "Editorial Calendar", icon: CalendarTodayOutlined, soon: true },
      { label: "SEO", icon: QueryStatsOutlined, soon: true },
      {
        label: "Settings",
        icon: SettingsOutlined,
        route: AdminRoutes.settings,
        capability: "settings:manage",
      },
    ],
  },
  {
    heading: "Content tools",
    items: [
      {
        label: "Homepage",
        icon: HomeOutlined,
        route: AdminRoutes.homepage,
        capability: "homepage:manage",
      },
      {
        label: "Editor's Picks",
        icon: StarOutline,
        route: AdminRoutes.editorsPicks,
        capability: "homepage:manage",
      },
      {
        label: "Creators",
        icon: MovieOutlined,
        route: AdminRoutes.creators,
        capability: "creators:manage",
      },
      {
        label: "Reels",
        icon: VideocamOutlined,
        route: AdminRoutes.reels,
        capability: "reels:manage",
      },
      {
        label: "Analytics",
        icon: InsightsOutlined,
        route: AdminRoutes.analytics,
        capability: "analytics:read",
      },
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

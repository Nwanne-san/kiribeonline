"use client";

import DashboardIcon from "@mui/icons-material/Dashboard";
import ArticleIcon from "@mui/icons-material/Article";
import HomeIcon from "@mui/icons-material/Home";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import CategoryIcon from "@mui/icons-material/Category";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import SettingsIcon from "@mui/icons-material/Settings";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import StarIcon from "@mui/icons-material/Star";
import MovieIcon from "@mui/icons-material/Movie";
import VideocamIcon from "@mui/icons-material/Videocam";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AdminRoutes } from "@/routes/admin.routes";
import { KiribeButton } from "@/modules/shared/components/ui";
import {
  NavigationProgressProvider,
  RouteProgress,
  useNavigationProgress,
} from "@/modules/shared/components/brand";

const navItems = [
  { label: "Dashboard", route: AdminRoutes.dashboard, icon: DashboardIcon },
  { label: "Articles", route: AdminRoutes.articles, icon: ArticleIcon },
  { label: "Homepage", route: AdminRoutes.homepage, icon: HomeIcon },
  { label: "Editor's Picks", route: AdminRoutes.editorsPicks, icon: StarIcon },
  { label: "Creators", route: AdminRoutes.creators, icon: MovieIcon },
  { label: "Reels", route: AdminRoutes.reels, icon: VideocamIcon },
  { label: "Media", route: AdminRoutes.media, icon: PhotoLibraryIcon },
  { label: "Categories", route: AdminRoutes.categories, icon: CategoryIcon },
  { label: "Tags", route: AdminRoutes.tags, icon: LocalOfferIcon },
  { label: "Settings", route: AdminRoutes.settings, icon: SettingsIcon },
  { label: "Analytics", route: AdminRoutes.analytics, icon: AnalyticsIcon },
];

function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate: (route: string) => void }) {
  return (
    <>
      <Toolbar sx={{ px: 2.5, minHeight: 64 }}>
        <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700, fontSize: "0.9375rem" }}>
          Kiribé Admin
        </Typography>
      </Toolbar>
      <List sx={{ px: 0 }}>
        {navItems.map(({ label, route, icon: Icon }) => {
          const active =
            pathname === route ||
            pathname.startsWith(`${route}/`) ||
            (route === AdminRoutes.articles && pathname.includes("/admin/articles"));
          return (
            <ListItemButton
              key={route}
              selected={active}
              onClick={() => onNavigate(route)}
              sx={{
                py: 1.1,
                pl: active ? 2 : 2.5,
                borderLeft: "3px solid",
                borderColor: active ? "primary.main" : "transparent",
                bgcolor: active ? "rgba(107, 29, 42, 0.06)" : "transparent",
                "&.Mui-selected": { bgcolor: "rgba(107, 29, 42, 0.06)" },
                "& .MuiListItemIcon-root": { color: active ? "primary.main" : "text.secondary", minWidth: 32 },
                "& .MuiListItemText-primary": {
                  fontSize: "0.8125rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? "primary.main" : "text.primary",
                },
              }}
            >
              <ListItemIcon>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          );
        })}
      </List>
    </>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <NavigationProgressProvider>
      <AdminShellBody>{children}</AdminShellBody>
    </NavigationProgressProvider>
  );
}

function AdminShellBody({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { start } = useNavigationProgress();

  const logout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.replace(AdminRoutes.login);
  };

  const navigate = (route: string) => {
    if (route !== pathname) start();
    router.push(route);
    setDrawerOpen(false);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: 240,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: 240, boxSizing: "border-box", borderRight: "1px solid", borderColor: "divider" },
          }}
        >
          <SidebarNav pathname={pathname} onNavigate={navigate} />
        </Drawer>
      )}

      {isMobile && (
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: 240 }}>
            <SidebarNav pathname={pathname} onNavigate={navigate} />
          </Box>
        </Drawer>
      )}

      <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
        <AppBar
          position="static"
          color="inherit"
          elevation={0}
          sx={{ position: "relative", borderBottom: "1px solid", borderColor: "divider" }}
        >
          <RouteProgress />
          <Toolbar sx={{ justifyContent: "space-between", minHeight: 50 }}>
            {isMobile ? (
              <IconButton edge="start" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
                <MenuIcon />
              </IconButton>
            ) : (
              <Box />
            )}
            <KiribeButton startIcon={<LogoutIcon />} onClick={logout} size="small" variant="text" color="inherit">
              Log out
            </KiribeButton>
          </Toolbar>
        </AppBar>
        <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>{children}</Box>
      </Box>
    </Box>
  );
}

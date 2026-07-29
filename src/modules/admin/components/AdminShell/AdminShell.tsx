"use client";

import MenuRounded from "@mui/icons-material/MenuRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import FileUploadOutlined from "@mui/icons-material/FileUploadOutlined";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import PublicOutlined from "@mui/icons-material/PublicOutlined";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminRoutes } from "@/routes/admin.routes";
import { PublicRoutes } from "@/routes/public.routes";
import { ROLE_LABELS } from "@/server/access/roles";
import {
  NavigationProgressProvider,
  RouteProgress,
  BrandMark,
} from "@/modules/shared/components/brand";
import { InitialAvatar } from "@/modules/admin/components/ui/AdminPrimitives";
import { usePermissions } from "@/modules/admin/hooks/usePermissions";
import { useBreakpointUp } from "@/utils/hooks";
import { NAV_GROUPS, isNavActive, type NavGroup, type NavItem } from "./nav";

const COLLAPSE_KEY = "kiribe.admin.sidebarCollapsed";

const ACTIVE_ITEM = "bg-admin-primary text-white";
const IDLE_ITEM = "text-gray-400 hover:bg-white/[0.06] hover:text-white";

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
  const { me, can } = usePermissions();

  // Hide nav items the current role can't use so nobody clicks into a 403.
  // Items without a `capability` stay visible for everyone; a group that ends
  // up empty (e.g. its only items were gated) is dropped entirely.
  const navGroups = useMemo<NavGroup[]>(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.capability || can(item.capability)),
      })).filter((group) => group.items.length > 0),
    [can]
  );

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Matches the sidebar's `lg:flex` — above it the hamburger collapses the
  // sidebar to icons, below it the same button opens the mobile drawer.
  const isDesktop = useBreakpointUp("lg");

  // Restore the persisted collapse preference after mount (avoids SSR mismatch).
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    }
    setHydrated(true);
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleSidebar = useCallback(() => {
    if (isDesktop) {
      setCollapsed((prev) => {
        const next = !prev;
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
        return next;
      });
    } else {
      setMobileOpen((prev) => !prev);
    }
  }, [isDesktop]);

  const navigate = useCallback(
    (route: string) => {
      setMobileOpen(false);
      if (route !== pathname) router.push(route);
    },
    [pathname, router]
  );

  const logout = useCallback(async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.replace(AdminRoutes.login);
  }, [router]);

  const activeLabel =
    navGroups.flatMap((g) => g.items).find((i) => isNavActive(i, pathname))?.label ??
    "Dashboard";

  return (
    <div className="flex min-h-screen bg-surface-alt text-ink">
      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col bg-[#0c0c10] lg:flex ${
          hydrated ? "transition-[width] duration-300 ease-out" : ""
        } ${collapsed ? "w-[76px]" : "w-60"}`}
      >
        <Sidebar
          groups={navGroups}
          collapsed={collapsed}
          pathname={pathname}
          onNavigate={navigate}
          onViewSite={() => window.open(PublicRoutes.home, "_blank")}
          onLogout={logout}
        />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="animate-fadeIn absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="admin-drawer-enter absolute inset-y-0 left-0 flex w-60 flex-col bg-[#0c0c10] shadow-xl">
            <Sidebar
              groups={navGroups}
              collapsed={false}
              pathname={pathname}
              onNavigate={navigate}
              onViewSite={() => window.open(PublicRoutes.home, "_blank")}
              onLogout={logout}
            />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          activeLabel={activeLabel}
          userName={me?.name ?? me?.email ?? "Admin"}
          userRole={me ? ROLE_LABELS[me.role] : ""}
          onToggleSidebar={toggleSidebar}
          onNewArticle={() => navigate(AdminRoutes.articleNew)}
          onUpload={() => navigate(AdminRoutes.media)}
          onSearch={(q) =>
            router.push(`${AdminRoutes.articles}?q=${encodeURIComponent(q)}`)
          }
        />
        <RouteProgress />
        <main className="mx-auto w-full max-w-admin flex-1 px-4 py-6 md:px-6 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── Sidebar */

function Sidebar({
  groups,
  collapsed,
  pathname,
  onNavigate,
  onViewSite,
  onLogout,
}: {
  groups: NavGroup[];
  collapsed: boolean;
  pathname: string;
  onNavigate: (route: string) => void;
  onViewSite: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      <div
        className={`flex h-16 items-center gap-2 border-b border-white/5 ${
          collapsed ? "justify-center px-2" : "px-5"
        }`}
      >
        <BrandMark height={22} tone="light" />
        {!collapsed && (
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gray-500">
            CMS
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {groups.map((group, gi) => (
          <div key={group.heading ?? gi} className={gi > 0 ? "mt-4" : ""}>
            {group.heading && !collapsed && (
              <div className="px-5 pb-1.5 pt-2 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-gray-600">
                {group.heading}
              </div>
            )}
            {group.heading && collapsed && (
              <div className="mx-3 mb-2 border-t border-white/5" />
            )}
            <ul className="space-y-0.5 px-2">
              {group.items.map((item) => (
                <li key={item.label}>
                  <NavRow
                    item={item}
                    active={isNavActive(item, pathname)}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/5 px-2 py-3">
        <FooterRow
          icon={<PublicOutlined fontSize="small" />}
          label="View Website"
          collapsed={collapsed}
          onClick={onViewSite}
        />
        <FooterRow
          icon={<LogoutRounded fontSize="small" />}
          label="Log Out"
          collapsed={collapsed}
          onClick={onLogout}
        />
      </div>
    </>
  );
}

function NavRow({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate: (route: string) => void;
}) {
  const Icon = item.icon;
  const base = `group flex items-center rounded-lg text-[0.8125rem] font-medium transition-colors ${
    collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
  }`;

  if (item.soon || !item.route) {
    return (
      <span
        title={collapsed ? `${item.label} — coming soon` : undefined}
        className={`${base} cursor-not-allowed text-gray-600`}
        aria-disabled
      >
        <Icon fontSize="small" />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-wide text-gray-500">
              Soon
            </span>
          </>
        )}
      </span>
    );
  }

  return (
    <button
      type="button"
      title={collapsed ? item.label : undefined}
      onClick={() => onNavigate(item.route as string)}
      className={`${base} w-full ${active ? ACTIVE_ITEM : IDLE_ITEM}`}
    >
      <Icon fontSize="small" />
      {!collapsed && <span className="flex-1 truncate text-left">{item.label}</span>}
    </button>
  );
}

function FooterRow({
  icon,
  label,
  collapsed,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={collapsed ? label : undefined}
      onClick={onClick}
      className={`flex w-full items-center rounded-lg text-[0.8125rem] font-medium text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white ${
        collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
      }`}
    >
      {icon}
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────── Top bar */

function TopBar({
  activeLabel,
  userName,
  userRole,
  onToggleSidebar,
  onNewArticle,
  onUpload,
  onSearch,
}: {
  activeLabel: string;
  userName: string;
  userRole: string;
  onToggleSidebar: () => void;
  onNewArticle: () => void;
  onUpload: () => void;
  onSearch: (q: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur md:px-6">
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-secondary transition-colors hover:bg-surface-muted"
      >
        <MenuRounded fontSize="small" />
      </button>

      <nav
        aria-label="Breadcrumb"
        className="hidden shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] sm:flex"
      >
        <span className="text-muted">Kiribé CMS</span>
        <ChevronRightRounded className="text-[14px] text-muted-soft"/>
        <span className="text-admin-primary">{activeLabel}</span>
      </nav>

      <form
        className="ml-auto hidden min-w-0 max-w-md flex-1 items-center gap-2 rounded-none border border-border bg-surface-alt px-3 py-2 md:flex lg:ml-6 lg:mr-auto"
        onSubmit={(e) => {
          e.preventDefault();
          const q = inputRef.current?.value.trim();
          if (q) onSearch(q);
        }}
      >
        <SearchRounded className="text-[18px] shrink-0 text-muted-soft"/>
        <input
          ref={inputRef}
          type="search"
          placeholder="Search articles, pages, media, users…"
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted-soft"
        />
      </form>

      <div className="ml-auto flex items-center gap-2 md:ml-0">
        <button
          type="button"
          onClick={onNewArticle}
          className="hidden items-center gap-1.5 rounded-none bg-admin-primary px-3 py-2 font-headline text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-admin-accent hover:text-admin-primary sm:inline-flex"
        >
          <AddRounded className="text-[16px]" />
          New Article
        </button>
        <button
          type="button"
          onClick={onUpload}
          className="hidden items-center gap-1.5 rounded-none border border-border px-3 py-2 font-headline text-xs font-semibold uppercase tracking-widest text-ink-secondary transition-colors hover:border-admin-primary hover:text-admin-primary sm:inline-flex"
        >
          <FileUploadOutlined className="text-[16px]" />
          Upload
        </button>

        <div className="flex items-center gap-2 pl-1">
          <InitialAvatar name={userName} className="h-8 w-8" />
          <div className="hidden leading-tight lg:block">
            <div className="max-w-[10rem] truncate text-[0.8125rem] font-semibold text-ink">
              {userName}
            </div>
            {userRole && <div className="text-[0.6875rem] text-muted">{userRole}</div>}
          </div>
        </div>
      </div>
    </header>
  );
}

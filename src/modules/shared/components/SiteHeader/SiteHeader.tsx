"use client";

import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Drawer from "@mui/material/Drawer";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PublicRoutes } from "@/routes/public.routes";
import type { PublicCategory } from "@/lib/content/query-categories";
import type { SiteSettings } from "@/modules/shared/types/content";
import { KiribeButton, publicRoute } from "@/modules/shared/components/ui";
import { cn } from "@/modules/shared/components/tw";
import {
  BrandMark,
  RouteProgress,
  useNavigationProgress,
} from "@/modules/shared/components/brand";
import {
  resolveSocialIconLinks,
  resolveSocialLinks,
} from "@/modules/shared/components/social";
import { useSubscribeModal } from "@/modules/marketing/components/SubscribeModal";
import { HeaderSearch } from "./HeaderSearch";

type NavLink = { label: string; href: string };

const footerLinkClass =
  "text-[#99A1AF] text-sm transition-colors duration-[var(--duration-fast)] ease-in-out hover:text-white";

const footerLinkSmClass = cn(footerLinkClass, "text-xs");

const colHeadingClass =
  "font-headline font-medium text-sm tracking-wide text-white uppercase mb-4";

/**
 * Social rail — Figma V5 nav. Icons resolve to admin-configured links by
 * platform key; the key list lives in `@/constants` and the icon mapping in
 * `components/social`, so the admin's platform picker, this rail, the footer, and
 * the About page can't drift apart.
 */
function SocialRail({ socialLinks }: { socialLinks?: SiteSettings["socialLinks"] }) {
  const items = resolveSocialIconLinks(socialLinks);

  if (items.length === 0) return null;

  return (
    <Stack
      direction="row"
      alignItems="center"
      className="hidden lg:flex pr-3 mr-1 border-r border-border"
    >
      {items.map(({ key, label, Icon, href }) => (
        <IconButton
          key={key}
          component="a"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          size="small"
          className="p-1.5 text-muted hover:text-burgundy"
        >
          <Icon className="text-[15px]" />
        </IconButton>
      ))}
    </Stack>
  );
}

/** Primary nav as designed in Figma 2001:2 — fixed order, six labels. */
const PRIMARY_NAV: { label: string; slug: string }[] = [
  { label: "Film", slug: "film" },
  { label: "TV", slug: "tv" },
  { label: "Videos", slug: "videos" },
  { label: "News", slug: "news" },
  { label: "Opinion", slug: "opinion" },
  { label: "Spotlight", slug: "spotlight" },
];

/**
 * Videos and Spotlight own hand-built archives at `/categories/<slug>` — Videos
 * renders the reels collection, Spotlight renders creator profiles. Neither
 * needs a matching CMS category record, so they must never fall back to the
 * categories index the way an unconfigured section does.
 */
const STANDALONE_ARCHIVES: Record<string, string> = {
  videos: PublicRoutes.categoryVideos,
  spotlight: publicRoute(PublicRoutes.categoryDetail, { slug: "spotlight" }),
};

function buildPrimaryNav(navCategories: PublicCategory[]): NavLink[] {
  const knownSlugs = new Set(navCategories.map((c) => c.slug));
  return PRIMARY_NAV.map(({ label, slug }) => ({
    label,
    href:
      STANDALONE_ARCHIVES[slug] ??
      (knownSlugs.has(slug)
        ? publicRoute(PublicRoutes.categoryDetail, { slug })
        : PublicRoutes.categories),
  }));
}

const navLinkClass = (active: boolean) =>
  cn(
    "font-headline text-sm font-medium tracking-wide uppercase transition-colors duration-[var(--duration-fast)] ease-in-out hover:text-burgundy",
    active ? "text-burgundy" : "text-ink-secondary"
  );

const drawerNavLinkClass = (active: boolean) =>
  cn(
    "relative pl-5 pr-5 py-3 font-headline text-sm font-medium tracking-[0.04em] uppercase border-l-[3px] transition-colors hover:bg-black/5 hover:text-burgundy",
    active ? "text-burgundy border-l-burgundy" : "text-ink border-l-transparent"
  );

const drawerMoreLinkClass = (active: boolean) =>
  cn(
    "relative pl-5 pr-5 py-3 text-sm font-semibold border-l-[3px] transition-colors hover:bg-black/5",
    active ? "text-burgundy border-l-burgundy" : "text-ink border-l-transparent"
  );

export function SiteHeader({
  siteSettings,
  navCategories = [],
}: {
  siteSettings?: SiteSettings;
  navCategories?: PublicCategory[];
}) {
  const nav = buildPrimaryNav(navCategories);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const { pending } = useNavigationProgress();
  const { open: openSubscribe } = useSubscribeModal();

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        className="bg-surface border-b border-border"
      >
        <Container maxWidth={false} className="editorial-container">
          <Toolbar
            disableGutters
            className="min-h-16 h-16 gap-2 md:gap-4 items-center"
          >
            <IconButton
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex lg:hidden text-ink p-1"
              size="small"
            >
              <MenuIcon />
            </IconButton>

            <NextLink
              href={PublicRoutes.home}
              aria-label="Kiribé home"
              style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}
            >
              <BrandMark height={40} loading={pending} />
            </NextLink>

            <Stack
              direction="row"
              spacing={3}
              className="flex-1 justify-center hidden lg:flex"
            >
              {nav.map(({ label, href }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={label}
                    component={NextLink}
                    href={href}
                    underline="none"
                    aria-current={active ? "page" : undefined}
                    className={navLinkClass(active)}
                  >
                    {label}
                  </Link>
                );
              })}
            </Stack>

            <Box className="flex-1 lg:flex-none" />

            <Stack direction="row" spacing={1} alignItems="center" className="shrink-0">
              <SocialRail socialLinks={siteSettings?.socialLinks} />
              <HeaderSearch categories={navCategories} />
              <KiribeButton
                onClick={openSubscribe}
                size="small"
                className="hidden sm:inline-flex px-5 py-2 rounded-none font-headline text-sm font-medium tracking-wide uppercase text-white shadow-none hover:shadow-none"
              >
                Subscribe
              </KiribeButton>
            </Stack>
          </Toolbar>
        </Container>
        <RouteProgress />
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        slotProps={{ paper: { className: "w-[85vw] sm:w-80" } }}
      >
        <Box className="flex flex-col h-full">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            className="px-5 py-4 border-b border-border"
          >
            <NextLink
              href={PublicRoutes.home}
              onClick={() => setDrawerOpen(false)}
              aria-label="Kiribé home"
              style={{ display: "inline-flex" }}
            >
              <BrandMark height={32} loading={pending} />
            </NextLink>
            <IconButton
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Stack>

          <Stack spacing={0} className="py-2 flex-1 overflow-y-auto">
            {nav.map(({ label, href }) => {
              const active = pathname === href;
              return (
                <Link
                  key={label}
                  component={NextLink}
                  href={href}
                  underline="none"
                  onClick={() => setDrawerOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={drawerNavLinkClass(active)}
                >
                  {label}
                </Link>
              );
            })}

            <Box className="px-5 pt-4 pb-1 font-body text-[0.6875rem] font-semibold tracking-[0.15em] uppercase text-ink-secondary">
              More
            </Box>

            {[
              { label: "All Articles", href: PublicRoutes.articles },
              { label: "About", href: PublicRoutes.about },
              { label: "Contact", href: PublicRoutes.contact },
            ].map(({ label, href }) => {
              const active = pathname === href;
              return (
                <Link
                  key={label}
                  component={NextLink}
                  href={href}
                  underline="none"
                  onClick={() => setDrawerOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={drawerMoreLinkClass(active)}
                >
                  {label}
                </Link>
              );
            })}
          </Stack>

          <Box className="p-5 border-t border-border">
            <KiribeButton
              fullWidth
              onClick={() => {
                setDrawerOpen(false);
                openSubscribe();
              }}
              className="py-2.5 rounded-none font-headline text-sm tracking-wide uppercase text-white"
            >
              Subscribe
            </KiribeButton>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}

/**
 * Footer "Sections" column is fixed to the Figma editorial set
 * (Film / Television / Videos / News, node 2001:450). It does NOT auto-expand
 * when admins add new categories.
 */
const FOOTER_SECTIONS: { name: string; slug: string }[] = [
  { name: "Film", slug: "film" },
  { name: "TV", slug: "tv" },
  { name: "Videos", slug: "videos" },
  { name: "News", slug: "news" },
  { name: "Opinion", slug: "opinion" },
  { name: "Spotlight", slug: "spotlight" },
];

export function SiteFooter({
  siteSettings,
}: {
  siteSettings?: SiteSettings;
  navCategories?: PublicCategory[];
}) {
  const brandName = siteSettings?.siteName ?? "Kiribe Online";
  const tagline =
    siteSettings?.seoDefaults?.description ??
    "Your source for thoughtful entertainment journalism.";
  const socialLinks = resolveSocialLinks(siteSettings?.socialLinks);
  const sections = FOOTER_SECTIONS;

  return (
    <Box component="footer" className="bg-footer text-white">
      <Container maxWidth={false} className="editorial-container py-12 md:py-16">
        <Grid container spacing={{ xs: 4, md: 4 }}>
          <Grid size={{ xs: 12, base: 3 }}>
            <Box className="mb-4">
              <BrandMark height={48} tone="light" />
            </Box>
            <Typography
              variant="body2"
              className="text-[#99A1AF] max-w-[260px] text-sm leading-[1.6]"
            >
              {tagline}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6, md: 4, base: 3 }}>
            <Typography className={colHeadingClass}>Sections</Typography>
            <Stack spacing={1.25}>
              {sections.map((item) => (
                <Link
                  key={item.slug}
                  component={NextLink}
                  href={publicRoute(PublicRoutes.categoryDetail, { slug: item.slug })}
                  underline="hover"
                  className={footerLinkClass}
                >
                  {item.name}
                </Link>
              ))}
            </Stack>
          </Grid>

          <Grid size={{ xs: 6, md: 4, base: 3 }}>
            <Typography className={colHeadingClass}>About</Typography>
            <Stack spacing={1.25}>
              <Link component={NextLink} href={PublicRoutes.about} underline="hover" className={footerLinkClass}>
                About Us
              </Link>
              <Link component={NextLink} href={PublicRoutes.about} underline="hover" className={footerLinkClass}>
                Editorial Team
              </Link>
              <Link component={NextLink} href={PublicRoutes.contact} underline="hover" className={footerLinkClass}>
                Contact
              </Link>
              {/*
                RSS feed link — a plain anchor (not NextLink) so the browser
                treats `/feed.xml` as a document navigation and hands it off
                to the OS or feed reader instead of trying to render it in-app.
              */}
              <Link
                href="/feed.xml"
                underline="hover"
                className={footerLinkClass}
                aria-label="Subscribe to the Kiribé Online RSS feed"
              >
                RSS Feed
              </Link>
            </Stack>
          </Grid>

          {/* Only rendered once an admin has saved social links — a Follow column
              of dead `#` links is worse than no column. */}
          {socialLinks.length > 0 && (
            <Grid size={{ xs: 12, md: 4, base: 3 }}>
              <Typography className={colHeadingClass}>Follow</Typography>
              <Stack spacing={1.25}>
                {socialLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    className={footerLinkClass}
                  >
                    {link.label}
                  </Link>
                ))}
              </Stack>
            </Grid>
          )}
        </Grid>

        <Box className="mt-8 md:mt-10 pt-8 border-t border-[#1E2939] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Typography variant="caption" className="text-[#99A1AF] text-sm">
            © {new Date().getFullYear()} {brandName}. All rights reserved.
          </Typography>
          <Stack
            direction="row"
            alignItems="center"
            spacing={{ xs: 2, sm: 3 }}
            className="flex-wrap gap-y-2"
          >
            <Link
              component={NextLink}
              href={PublicRoutes.privacy}
              underline="hover"
              className={footerLinkSmClass}
            >
              Privacy Policy
            </Link>
            <Link
              component={NextLink}
              href={PublicRoutes.terms}
              underline="hover"
              className={footerLinkSmClass}
            >
              Terms of Use
            </Link>
            <Link
              component={NextLink}
              href="/admin"
              underline="hover"
              className="text-[#4A5565] text-xs transition-colors duration-[var(--duration-fast)] ease-in-out hover:text-white"
            >
              Admin ↗
            </Link>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

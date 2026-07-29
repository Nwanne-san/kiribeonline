"use client";

import CloseIcon from "@mui/icons-material/Close";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import MenuIcon from "@mui/icons-material/Menu";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import TwitterIcon from "@mui/icons-material/Twitter";
import YouTubeIcon from "@mui/icons-material/YouTube";
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
import type { SvgIconComponent } from "@mui/icons-material";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NAV_MAX_HEADER_LINKS } from "@/constants";
import { PublicRoutes } from "@/routes/public.routes";
import type { PublicCategory } from "@/lib/content/query-categories";
import type { SiteSettings } from "@/modules/shared/types/content";
import { KiribeButton, publicRoute } from "@/modules/shared/components/ui";
import {
  BrandMark,
  RouteProgress,
  useNavigationProgress,
} from "@/modules/shared/components/brand";
import { useSubscribeModal } from "@/modules/marketing/components/SubscribeModal";
import { HeaderSearch } from "./HeaderSearch";

type NavLink = { label: string; href: string };

/** Social rail — Figma V5 nav. Icons resolve to admin-configured links by platform. */
const SOCIAL_ICONS: { key: string; label: string; Icon: SvgIconComponent }[] = [
  { key: "facebook", label: "Facebook", Icon: FacebookIcon },
  { key: "instagram", label: "Instagram", Icon: InstagramIcon },
  { key: "twitter", label: "X", Icon: TwitterIcon },
  { key: "linkedin", label: "LinkedIn", Icon: LinkedInIcon },
  { key: "youtube", label: "YouTube", Icon: YouTubeIcon },
  { key: "tiktok", label: "TikTok", Icon: MusicNoteIcon },
];

function resolveSocialHref(
  platformKey: string,
  socialLinks: SiteSettings["socialLinks"]
): string | undefined {
  const match = socialLinks?.find(
    (link) => link.platform?.toLowerCase().replace(/\s+/g, "") === platformKey
  );
  return match?.url;
}

function SocialRail({ socialLinks }: { socialLinks?: SiteSettings["socialLinks"] }) {
  const items = SOCIAL_ICONS.map((social) => ({
    ...social,
    href: resolveSocialHref(social.key, socialLinks),
  })).filter((social) => Boolean(social.href));

  if (items.length === 0) return null;

  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        display: { xs: "none", lg: "flex" },
        pr: 1.5,
        mr: 0.5,
        borderRight: "1px solid",
        borderColor: "divider",
      }}
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
          sx={{ p: 0.75, color: "#6A7282", "&:hover": { color: "primary.main" } }}
        >
          <Icon sx={{ fontSize: 15 }} />
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
 * Resolves the header row, in priority order:
 *
 *  1. Nav saved under Settings → Navigation & Footer, if an admin configured one
 *  2. the Figma default set, resolved against the categories that exist
 *
 * Either way the result is capped at `NAV_MAX_HEADER_LINKS`. The Figma nav is a
 * single centred row, and past six labels it wraps into the search + Subscribe
 * cluster on laptop widths. Overflow categories stay reachable from
 * `/categories` and the mobile drawer.
 */
function buildPrimaryNav(
  navCategories: PublicCategory[],
  savedNav?: SiteSettings["navigation"]
): NavLink[] {
  const saved = savedNav?.headerLinks ?? [];
  if (saved.length > 0) {
    return saved.slice(0, NAV_MAX_HEADER_LINKS);
  }

  const knownSlugs = new Set(navCategories.map((c) => c.slug));
  return PRIMARY_NAV.slice(0, NAV_MAX_HEADER_LINKS).map(({ label, slug }) => ({
    label,
    href: knownSlugs.has(slug)
      ? publicRoute(PublicRoutes.categoryDetail, { slug })
      : PublicRoutes.categories,
  }));
}

export function SiteHeader({
  siteSettings,
  navCategories = [],
}: {
  siteSettings?: SiteSettings;
  navCategories?: PublicCategory[];
}) {
  const nav = buildPrimaryNav(navCategories, siteSettings?.navigation);
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
        sx={{
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: "var(--container-editorial)", mx: "auto", px: { xs: 2, md: 4 } }}>
          <Toolbar
            disableGutters
            sx={{
              minHeight: 64,
              height: 64,
              gap: { xs: 1, md: 2 },
              alignItems: "center",
            }}
          >
            <IconButton
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
              sx={{
                display: { xs: "inline-flex", lg: "none" },
                color: "text.primary",
                p: 0.5,
              }}
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
              sx={{
                flex: 1,
                justifyContent: "center",
                display: { xs: "none", lg: "flex" },
              }}
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
                    sx={{
                      fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      letterSpacing: "0.025em",
                      textTransform: "uppercase",
                      color: active ? "primary.main" : "#364153",
                      transition: "color var(--duration-fast) ease",
                      "&:hover": { color: "primary.main" },
                    }}
                  >
                    {label}
                  </Link>
                );
              })}
            </Stack>

            <Box sx={{ flex: { xs: 1, lg: 0 } }} />

            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
              <SocialRail socialLinks={siteSettings?.socialLinks} />
              <HeaderSearch categories={navCategories} />
              {/*
                Sharp corners, Outfit, uppercase, tracking and padding now come
                from the MuiButton theme — this is the CTA every other button
                is matched to, so it must not re-declare them locally.
              */}
              <KiribeButton
                onClick={openSubscribe}
                size="medium"
                sx={{
                  display: { xs: "none", sm: "inline-flex" },
                  color: "common.white",
                  px: 2.5,
                  py: 1,
                  borderRadius: 0,
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  letterSpacing: "0.025em",
                  textTransform: "uppercase",
                }}
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
        slotProps={{ paper: { sx: { width: { xs: "85vw", sm: 320 } } } }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 2.5, py: 2, borderBottom: "1px solid", borderColor: "divider" }}
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

          <Stack spacing={0} sx={{ py: 1, flex: 1, overflowY: "auto" }}>
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
                  sx={{
                    position: "relative",
                    pl: 2.5,
                    pr: 2.5,
                    py: 1.5,
                    fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: active ? "primary.main" : "text.primary",
                    /* 3px burgundy rail on the active row — same signal as the
                       admin sidebar so the two chromes stay coherent. */
                    borderLeft: "3px solid",
                    borderLeftColor: active ? "primary.main" : "transparent",
                    "&:hover": { bgcolor: "action.hover", color: "primary.main" },
                  }}
                >
                  {label}
                </Link>
              );
            })}

            <Box
              sx={{
                px: 2.5,
                pt: 2,
                pb: 0.5,
                fontFamily: "var(--font-body), 'Open Sans', sans-serif",
                fontSize: "0.6875rem",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "text.secondary",
              }}
            >
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
                  sx={{
                    position: "relative",
                    pl: 2.5,
                    pr: 2.5,
                    py: 1.5,
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: active ? "primary.main" : "text.primary",
                    borderLeft: "3px solid",
                    borderLeftColor: active ? "primary.main" : "transparent",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </Stack>

          <Box sx={{ p: 2.5, borderTop: "1px solid", borderColor: "divider" }}>
            <KiribeButton
              fullWidth
              onClick={() => {
                setDrawerOpen(false);
                openSubscribe();
              }}
              sx={{
                py: 1.25,
                borderRadius: 0,
                fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                fontSize: "0.875rem",
                letterSpacing: "0.025em",
                textTransform: "uppercase",
                color: "common.white",
              }}
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
 * Footer "Sections" column falls back to the Figma editorial set
 * (Film / Television / Videos / News, node 2001:450) when no admin-saved footer
 * exists. It does NOT auto-expand when admins add new categories.
 */
const FOOTER_SECTIONS: { name: string; slug: string }[] = [
  { name: "Film", slug: "film" },
  { name: "TV", slug: "tv" },
  { name: "Videos", slug: "videos" },
  { name: "News", slug: "news" },
  { name: "Opinion", slug: "opinion" },
  { name: "Spotlight", slug: "spotlight" },
];

/**
 * Route a footer link through NextLink only when it's an in-app path. Feed and
 * file URLs (`/feed.xml`) need a real document navigation so the browser hands
 * them to the OS or a feed reader instead of rendering them in-app; external
 * URLs open in a new tab.
 */
function footerLinkProps(href: string) {
  if (/^https?:\/\//i.test(href)) {
    return { href, target: "_blank", rel: "noopener noreferrer" as const };
  }
  const isFile = /\.[a-z0-9]+$/i.test(href);
  return isFile ? { href } : { component: NextLink, href };
}

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
  const socialLinks = siteSettings?.socialLinks ?? [];
  const sections = FOOTER_SECTIONS;
  // Two editable columns sit between the brand block and Follow — keep the
  // Figma four-column grid intact even if an admin saved more.
  const savedFooterColumns = (siteSettings?.navigation?.footerColumns ?? []).slice(
    0,
    2
  );

  const footerLinkSx = {
    color: "#99A1AF",
    fontSize: "0.875rem",
    transition: "color var(--duration-fast) ease",
    "&:hover": { color: "common.white" },
  } as const;

  const colHeadingSx = {
    fontFamily: "var(--font-headline), 'Outfit', sans-serif",
    fontWeight: 500,
    fontSize: "0.875rem",
    letterSpacing: "0.025em",
    color: "common.white",
    textTransform: "uppercase",
    mb: 2,
  } as const;

  return (
    <Box component="footer" sx={{ bgcolor: "#101828", color: "common.white" }}>
      <Container maxWidth={false} sx={{ maxWidth: "var(--container-editorial)", mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 6, md: 8 } }}>
        <Grid container spacing={{ xs: 4, md: 4 }}>
          <Grid size={{ xs: 12, base: 3 }}>
            <Box sx={{ mb: 2 }}>
              <BrandMark height={48} tone="light" />
            </Box>
            <Typography
              variant="body2"
              sx={{ color: "#99A1AF", maxWidth: 260, fontSize: "0.875rem", lineHeight: 1.6 }}
            >
              {tagline}
            </Typography>
          </Grid>

          {savedFooterColumns.length > 0 ? (
            savedFooterColumns.map((col) => (
              <Grid key={col.title} size={{ xs: 6, md: 4, base: 3 }}>
                <Typography sx={colHeadingSx}>{col.title}</Typography>
                <Stack spacing={1.25}>
                  {col.links.map((link) => (
                    <Link
                      key={`${col.title}-${link.href}`}
                      {...footerLinkProps(link.href)}
                      underline="hover"
                      sx={footerLinkSx}
                    >
                      {link.label}
                    </Link>
                  ))}
                </Stack>
              </Grid>
            ))
          ) : (
            <>
              <Grid size={{ xs: 6, md: 4, base: 3 }}>
                <Typography sx={colHeadingSx}>Sections</Typography>
                <Stack spacing={1.25}>
                  {sections.map((item) => (
                    <Link
                      key={item.slug}
                      component={NextLink}
                      href={publicRoute(PublicRoutes.categoryDetail, { slug: item.slug })}
                      underline="hover"
                      sx={footerLinkSx}
                    >
                      {item.name}
                    </Link>
                  ))}
                </Stack>
              </Grid>

              <Grid size={{ xs: 6, md: 4, base: 3 }}>
                <Typography sx={colHeadingSx}>About</Typography>
                <Stack spacing={1.25}>
                  <Link component={NextLink} href={PublicRoutes.about} underline="hover" sx={footerLinkSx}>
                    About Us
                  </Link>
                  <Link component={NextLink} href={PublicRoutes.about} underline="hover" sx={footerLinkSx}>
                    Editorial Team
                  </Link>
                  <Link component={NextLink} href={PublicRoutes.contact} underline="hover" sx={footerLinkSx}>
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
                    sx={footerLinkSx}
                    aria-label="Subscribe to the Kiribé Online RSS feed"
                  >
                    RSS Feed
                  </Link>
                </Stack>
              </Grid>
            </>
          )}

          <Grid size={{ xs: 12, md: 4, base: 3 }}>
            <Typography sx={colHeadingSx}>Follow</Typography>
            <Stack spacing={1.25}>
              {(socialLinks.length > 0
                ? socialLinks.map((link) => ({ label: link.platform, href: link.url }))
                : [
                    { label: "Instagram", href: "#" },
                    { label: "Twitter", href: "#" },
                    { label: "YouTube", href: "#" },
                  ]
              ).map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  underline="hover"
                  sx={footerLinkSx}
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: { xs: 4, md: 5 },
            pt: 4,
            borderTop: "1px solid",
            borderColor: "#1E2939",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "#99A1AF", fontSize: "0.875rem" }}
          >
            © {new Date().getFullYear()} {brandName}. All rights reserved.
          </Typography>
          <Stack
            direction="row"
            alignItems="center"
            spacing={{ xs: 2, sm: 3 }}
            sx={{ flexWrap: "wrap", rowGap: 1 }}
          >
            <Link
              component={NextLink}
              href={PublicRoutes.privacy}
              underline="hover"
              sx={{ ...footerLinkSx, fontSize: "0.75rem" }}
            >
              Privacy Policy
            </Link>
            <Link
              component={NextLink}
              href={PublicRoutes.terms}
              underline="hover"
              sx={{ ...footerLinkSx, fontSize: "0.75rem" }}
            >
              Terms of Use
            </Link>
            <Link
              component={NextLink}
              href="/admin"
              underline="hover"
              sx={{
                color: "#4A5565",
                fontSize: "0.75rem",
                transition: "color var(--duration-fast) ease",
                "&:hover": { color: "common.white" },
              }}
            >
              Admin ↗
            </Link>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

"use client";

import MuiLink, { type LinkProps as MuiLinkProps } from "@mui/material/Link";
import type { SxProps, Theme } from "@mui/material/styles";
import NextLink from "next/link";
import { PublicRoutes } from "@/routes/public.routes";

type KiribeLinkVariant = "default" | "navLink" | "footerLink";

export type KiribeLinkProps = Omit<MuiLinkProps, "href" | "variant"> & {
  href: string;
  external?: boolean;
  linkVariant?: KiribeLinkVariant;
};

function isExternalUrl(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:");
}

const variantSx: Record<KiribeLinkVariant, SxProps<Theme>> = {
  default: {},
  navLink: {
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: "text.primary",
    "&:hover": { color: "primary.main" },
  },
  footerLink: {
    fontSize: "0.875rem",
    color: "rgba(255,255,255,0.75)",
    "&:hover": { color: "common.white" },
  },
};

/** Next.js Link + MUI Link with Kiribe nav/footer variants. */
export function KiribeLink({
  href,
  external,
  linkVariant = "default",
  children,
  sx,
  ...props
}: KiribeLinkProps) {
  const isExternal = external ?? isExternalUrl(href);
  const mergedSx: SxProps<Theme> = [variantSx[linkVariant], ...(Array.isArray(sx) ? sx : sx ? [sx] : [])];

  if (isExternal) {
    return (
      <MuiLink
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        underline={props.underline ?? "hover"}
        sx={mergedSx}
        {...props}
      >
        {children}
      </MuiLink>
    );
  }

  return (
    <MuiLink
      component={NextLink}
      href={href}
      underline={props.underline ?? "hover"}
      sx={mergedSx}
      {...props}
    >
      {children}
    </MuiLink>
  );
}

/** Build a public route path from enum + params (e.g. article slug). */
export function publicRoute(
  route: PublicRoutes,
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

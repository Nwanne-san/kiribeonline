"use client";

import MuiLink, { type LinkProps as MuiLinkProps } from "@mui/material/Link";
import NextLink from "next/link";
import { cn } from "@/modules/shared/components/tw";
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

const variantClass: Record<KiribeLinkVariant, string> = {
  default: "",
  navLink:
    "text-xs font-semibold tracking-[0.05em] uppercase text-ink hover:text-burgundy",
  footerLink: "text-sm text-white/75 hover:text-white",
};

/** Next.js Link + MUI Link with Kiribe nav/footer variants. Prefer `className` over `sx`. */
export function KiribeLink({
  href,
  external,
  linkVariant = "default",
  children,
  className,
  sx,
  ...props
}: KiribeLinkProps) {
  const isExternal = external ?? isExternalUrl(href);
  const mergedClassName = cn(variantClass[linkVariant], className);

  if (isExternal) {
    return (
      <MuiLink
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        underline={props.underline ?? "hover"}
        className={mergedClassName}
        sx={sx}
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
      className={mergedClassName}
      sx={sx}
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

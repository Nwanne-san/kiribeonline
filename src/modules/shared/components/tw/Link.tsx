"use client";

import * as React from "react";
import NextLink from "next/link";
import { cn } from "./cn";

type Variant = "default" | "nav" | "footer" | "inline";

type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  variant?: Variant;
  external?: boolean;
};

const VARIANT: Record<Variant, string> = {
  default: "text-burgundy hover:underline",
  nav: "font-headline text-sm font-medium uppercase tracking-[0.04em] text-ink hover:text-burgundy transition-colors",
  footer: "text-sm text-white/70 hover:text-white transition-colors",
  inline: "underline underline-offset-2 hover:text-burgundy",
};

function isExternal(href: string) {
  return href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:");
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, variant = "default", external, className, children, ...props },
  ref
) {
  const isOff = external ?? isExternal(href);
  const classes = cn(VARIANT[variant], className);

  if (isOff) {
    return (
      <a
        ref={ref}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <NextLink ref={ref} href={href} className={classes} {...props}>
      {children}
    </NextLink>
  );
});

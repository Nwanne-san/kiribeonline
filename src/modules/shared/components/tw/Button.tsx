"use client";

import * as React from "react";
import NextLink from "next/link";
import { cn } from "./cn";

type Variant = "primary" | "accent" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size" | "type"> & {
    href?: undefined;
    type?: "button" | "submit" | "reset";
  };

type ButtonAsLink = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
    /** When linking off-domain, opens in a new tab safely. */
    external?: boolean;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const BASE =
  "inline-flex items-center justify-center gap-2 font-headline font-semibold uppercase tracking-[0.05em] " +
  "rounded transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

const VARIANT: Record<Variant, string> = {
  primary: "bg-burgundy text-white hover:bg-burgundy-dark",
  accent: "bg-mustard text-burgundy hover:bg-mustard-dark",
  outline:
    "bg-transparent text-burgundy border border-burgundy hover:bg-burgundy hover:text-white",
  ghost: "bg-transparent text-ink hover:bg-black/5",
};

const SIZE: Record<Size, string> = {
  sm: "text-xs px-3 py-2",
  md: "text-sm px-4 py-2.5",
  lg: "text-sm px-6 py-3",
};

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("h-4 w-4 animate-spin", className)}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 1-9 9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function isExternal(href: string) {
  return href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:");
}

export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      className,
      children,
      ...rest
    } = props;

    const classes = cn(BASE, VARIANT[variant], SIZE[size], fullWidth && "w-full", className);
    const content = (
      <>
        {loading && <Spinner />}
        {children}
      </>
    );

    if ("href" in rest && rest.href !== undefined) {
      const { href, external, ...anchorProps } = rest;
      const isOff = external ?? isExternal(href);
      if (isOff) {
        return (
          <a
            ref={ref as React.Ref<HTMLAnchorElement>}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={classes}
            {...anchorProps}
          >
            {content}
          </a>
        );
      }
      return (
        <NextLink
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          {...anchorProps}
        >
          {content}
        </NextLink>
      );
    }

    const buttonProps = rest as ButtonAsButton;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={buttonProps.type ?? "button"}
        disabled={buttonProps.disabled || loading}
        className={classes}
        {...buttonProps}
      >
        {content}
      </button>
    );
  }
);

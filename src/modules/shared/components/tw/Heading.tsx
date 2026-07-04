import * as React from "react";
import { cn } from "./cn";

type Variant = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "card" | "section";

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  variant?: Variant;
  /** Override the rendered HTML tag (defaults from variant). */
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "div";
  color?: "default" | "primary" | "muted" | "inherit" | "white";
};

const VARIANT_STYLES: Record<Variant, string> = {
  h1: "font-headline font-bold text-3xl md:text-4xl lg:text-[2.75rem] leading-tight tracking-tight",
  h2: "font-headline font-bold text-2xl md:text-3xl leading-tight tracking-tight",
  h3: "font-headline font-semibold text-xl md:text-2xl leading-snug",
  h4: "font-headline font-semibold text-lg md:text-xl leading-snug",
  h5: "font-headline font-semibold text-base md:text-lg leading-snug",
  h6: "font-headline font-semibold text-sm uppercase tracking-wider",
  card: "font-headline font-bold text-lg leading-snug",
  section:
    "font-headline font-bold text-2xl md:text-[1.75rem] uppercase tracking-wide",
};

const VARIANT_TAG: Record<Variant, "h1" | "h2" | "h3" | "h4" | "h5" | "h6"> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  card: "h3",
  section: "h2",
};

const COLOR: Record<NonNullable<HeadingProps["color"]>, string> = {
  default: "text-ink",
  primary: "text-burgundy",
  muted: "text-muted",
  inherit: "text-inherit",
  white: "text-white",
};

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  function Heading({ variant = "h2", as, color = "default", className, children, ...props }, ref) {
    const Tag = (as ?? VARIANT_TAG[variant]) as React.ElementType;
    return (
      <Tag
        ref={ref}
        className={cn(VARIANT_STYLES[variant], COLOR[color], className)}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);

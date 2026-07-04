import * as React from "react";
import { cn } from "./cn";

type SectionProps = React.HTMLAttributes<HTMLElement> & {
  /** Alternate background for visual rhythm between adjacent sections. */
  tone?: "default" | "alt" | "burgundy" | "footer";
  /** Override default vertical padding. */
  spacing?: "default" | "lg" | "compact";
};

const TONE: Record<NonNullable<SectionProps["tone"]>, string> = {
  default: "bg-surface text-ink",
  alt: "bg-surface-alt text-ink",
  burgundy: "bg-burgundy text-white",
  footer: "bg-footer text-white",
};

const SPACING: Record<NonNullable<SectionProps["spacing"]>, string> = {
  default: "py-12 md:py-16",
  lg: "py-16 md:py-24",
  compact: "py-8 md:py-10",
};

/** Vertical section wrapper. Pair with Container for content width. */
export const Section = React.forwardRef<HTMLElement, SectionProps>(
  function Section(
    { tone = "default", spacing = "default", className, children, ...props },
    ref
  ) {
    return (
      <section
        ref={ref}
        className={cn(TONE[tone], SPACING[spacing], className)}
        {...props}
      >
        {children}
      </section>
    );
  }
);

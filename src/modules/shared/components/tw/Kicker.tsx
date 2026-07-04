import * as React from "react";
import { cn } from "./cn";

type KickerProps = React.HTMLAttributes<HTMLSpanElement> & {
  color?: "mustard" | "burgundy" | "muted" | "white";
};

const COLOR: Record<NonNullable<KickerProps["color"]>, string> = {
  mustard: "text-mustard",
  burgundy: "text-burgundy",
  muted: "text-muted",
  white: "text-white/80",
};

/** Editorial kicker label — uppercase, tracked-out, brand-coloured. */
export const Kicker = React.forwardRef<HTMLSpanElement, KickerProps>(
  function Kicker({ color = "mustard", className, children, ...props }, ref) {
    return (
      <span
        ref={ref}
        className={cn(
          "font-body text-xs font-semibold uppercase tracking-[0.2em] inline-block",
          COLOR[color],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

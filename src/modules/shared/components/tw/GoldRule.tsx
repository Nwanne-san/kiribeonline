import * as React from "react";
import { cn } from "./cn";

type GoldRuleProps = React.HTMLAttributes<HTMLDivElement> & {
  width?: "sm" | "lg";
};

/** The 48 × 2 px mustard underline used throughout the editorial design. */
export function GoldRule({ width = "sm", className, ...props }: GoldRuleProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "h-0.5 bg-mustard",
        width === "lg" ? "w-24" : "w-12",
        className
      )}
      {...props}
    />
  );
}

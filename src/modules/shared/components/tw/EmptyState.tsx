import * as React from "react";
import { cn } from "./cn";

type EmptyStateProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

/** Polite dashed-border placeholder used across the homepage. */
export function EmptyState({ className, children, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border border-dashed border-border rounded py-10 md:py-14 text-center text-muted font-body text-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

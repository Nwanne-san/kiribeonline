import * as React from "react";
import { cn } from "./cn";

type ContainerProps = React.HTMLAttributes<HTMLDivElement>;

/** Editorial max-width wrapper (`--container-editorial`) with responsive horizontal padding. */
export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  function Container({ className, children, ...props }, ref) {
    return (
      <div ref={ref} className={cn("editorial-container", className)} {...props}>
        {children}
      </div>
    );
  }
);

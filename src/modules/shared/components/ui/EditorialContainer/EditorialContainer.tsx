"use client";

import Container, { ContainerProps } from "@mui/material/Container";
import { cn } from "@/modules/shared/components/tw";

/**
 * Max-width editorial content wrapper — prefer over raw Box or div.
 *
 * Width + horizontal padding come from `.editorial-container` in
 * `src/theme/tailwind.css` (mirrors `--container-editorial`). Prefer
 * `className` overrides; `sx` is accepted for back-compat during migration.
 */
export function EditorialContainer({
  children,
  className,
  sx,
  disableGutters = true,
  maxWidth = false,
  ...props
}: ContainerProps) {
  return (
    <Container
      disableGutters={disableGutters}
      maxWidth={maxWidth}
      className={cn("editorial-container", className)}
      sx={sx}
      {...props}
    >
      {children}
    </Container>
  );
}

"use client";

import Box, { BoxProps } from "@mui/material/Box";
import { cn } from "@/modules/shared/components/tw";

/**
 * Vertical section spacing for homepage and marketing blocks.
 * Prefer `className` overrides; `sx` is accepted for back-compat during migration.
 */
export function EditorialSection({ children, className, sx, ...props }: BoxProps) {
  return (
    <Box
      component="section"
      className={cn("editorial-section", className)}
      sx={sx}
      {...props}
    >
      {children}
    </Box>
  );
}

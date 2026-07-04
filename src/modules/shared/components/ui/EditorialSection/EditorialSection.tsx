"use client";

import Box, { BoxProps } from "@mui/material/Box";

/** Vertical section spacing for homepage and marketing blocks. */
export function EditorialSection({ children, sx, ...props }: BoxProps) {
  return (
    <Box component="section" sx={{ py: { xs: 6, md: 8 }, ...sx }} {...props}>
      {children}
    </Box>
  );
}

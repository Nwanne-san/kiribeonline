"use client";

import Container, { ContainerProps } from "@mui/material/Container";

/** Max-width editorial content wrapper — prefer over raw Box or div. */
export function EditorialContainer({ children, sx, ...props }: ContainerProps) {
  return (
    <Container maxWidth="lg" sx={{ px: { xs: 2, md: 4 }, ...sx }} {...props}>
      {children}
    </Container>
  );
}

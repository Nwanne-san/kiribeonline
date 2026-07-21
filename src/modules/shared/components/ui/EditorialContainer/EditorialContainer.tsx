"use client";

import Container, { ContainerProps } from "@mui/material/Container";

/**
 * Max-width editorial content wrapper — prefer over raw Box or div.
 *
 * The width itself comes from the `MuiContainer` root override in
 * `src/theme/muiTheme.ts` (1200px, mirroring `--container-editorial`), so this
 * deliberately does not pass `maxWidth` — doing so would reintroduce MUI's
 * breakpoint-derived width and put it back out of step with Tailwind surfaces.
 */
export function EditorialContainer({ children, sx, ...props }: ContainerProps) {
  return (
    <Container sx={{ px: { xs: 2, md: 4 }, ...sx }} {...props}>
      {children}
    </Container>
  );
}

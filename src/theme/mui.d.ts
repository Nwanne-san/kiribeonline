import type { CSSProperties } from "react";
import "@mui/material/styles";

declare module "@mui/material/styles" {
  /**
   * Breakpoint keys mirror the Tailwind `@theme` tokens in `tailwind.css` 1:1,
   * so `md` means 768px in both stacks. `base` (1024px) is Tailwind's own key
   * and exists here only so MUI call sites can target the same width.
   */
  interface BreakpointOverrides {
    xs: true;
    sm: true;
    md: true;
    base: true;
    lg: true;
    xl: true;
    "2xl": true;
    "3xl": true;
  }

  interface Palette {
    footer: Palette["primary"];
    archiveHero: Palette["primary"];
  }

  interface PaletteOptions {
    footer?: PaletteOptions["primary"];
    archiveHero?: PaletteOptions["primary"];
  }

  interface TypographyVariants {
    kicker: CSSProperties;
    sectionTitle: CSSProperties;
    navLink: CSSProperties;
    cardTitle: CSSProperties;
  }

  interface TypographyVariantsOptions {
    kicker?: CSSProperties;
    sectionTitle?: CSSProperties;
    navLink?: CSSProperties;
    cardTitle?: CSSProperties;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    kicker: true;
    sectionTitle: true;
    navLink: true;
    cardTitle: true;
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    accent: true;
  }
}

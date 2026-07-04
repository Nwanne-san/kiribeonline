import type { CSSProperties } from "react";
import "@mui/material/styles";

declare module "@mui/material/styles" {
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

"use client";

import { createTheme } from "@mui/material/styles";

const burgundy = {
  main: "#6B1D2A",
  dark: "#4A1420",
  light: "#8B2D3E",
  contrastText: "#FFFFFF",
};

const mustard = {
  main: "#C9A227",
  dark: "#A88620",
  light: "#EAB308",
  contrastText: "#1A1A1A",
};

/**
 * Canonical max content width. MUI derives `Container maxWidth="lg"` from the
 * `lg` breakpoint (1280px), which is wider than the editorial column should be,
 * so containers are pinned to this value below instead.
 * Keep in sync with `--container-editorial` in `src/theme/tailwind.css`.
 */
const CONTAINER_EDITORIAL = 1200;

/**
 * Breakpoint values are the Tailwind `@theme` tokens from `tailwind.css`, so a
 * given name collapses at the same width whether a component is written in MUI
 * `sx` or Tailwind utilities. `xs` is MUI's zero-floor rather than Tailwind's
 * 24rem min-width query — everything else matches exactly.
 *
 * Values are in **rem**, matching Tailwind v4. This matters: a `rem` media
 * query keys off the browser's default font size, so a reader who bumps theirs
 * gets the roomier layout earlier. Declaring these in px would silently
 * reintroduce the very split this theme exists to close.
 */
const breakpointValues = {
  xs: 0,
  sm: 30, // 480px
  md: 48, // 768px
  base: 64, // 1024px
  lg: 80, // 1280px
  xl: 90, // 1440px
  "2xl": 100, // 1600px
  "3xl": 120, // 1920px
};

export const muiTheme = createTheme({
  cssVariables: true,
  /* `step: 0.02` matches Tailwind's max-width epsilon so `down()` queries from
     either stack land on the same boundary (MUI's default is 5). */
  breakpoints: { unit: "rem", step: 0.02, values: breakpointValues },
  palette: {
    primary: burgundy,
    secondary: mustard,
    background: {
      default: "#FAF8F5",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1A1A1A",
      secondary: "#6B7280",
    },
    divider: "#E5E7EB",
    footer: {
      main: "#0A0A0A",
    },
    archiveHero: {
      main: "#1C1214",
    },
  },
  typography: {
    fontFamily: "var(--font-body), 'Open Sans', sans-serif",
    /* Sizes reference the fluid `--text-*` tokens defined in tailwind.css so
       both stacks scale identically — no per-call-site `fontSize: { xs, md }`. */
    h1: {
      fontFamily: "var(--font-headline), 'Outfit', sans-serif",
      fontSize: "var(--text-display)",
      lineHeight: 1.1,
      fontWeight: 700,
    },
    h2: {
      fontFamily: "var(--font-headline), 'Outfit', sans-serif",
      fontSize: "var(--text-section-title)",
      lineHeight: 1.2,
      fontWeight: 700,
    },
    h3: {
      fontFamily: "var(--font-headline), 'Outfit', sans-serif",
      fontSize: "var(--text-card-title)",
      lineHeight: 1.3,
      fontWeight: 600,
    },
    h4: {
      fontFamily: "var(--font-headline), 'Outfit', sans-serif",
      fontWeight: 600,
    },
    h5: {
      fontFamily: "var(--font-headline), 'Outfit', sans-serif",
      fontWeight: 600,
    },
    h6: {
      fontFamily: "var(--font-headline), 'Outfit', sans-serif",
      fontWeight: 600,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
    kicker: {
      fontFamily: "var(--font-body), 'Open Sans', sans-serif",
      fontSize: "var(--text-label)",
      fontWeight: 600,
      letterSpacing: "0.2em",
      textTransform: "uppercase",
    },
    sectionTitle: {
      fontFamily: "var(--font-headline), 'Outfit', sans-serif",
      fontSize: "var(--text-section-title)",
      fontWeight: 700,
      letterSpacing: "0.02em",
      textTransform: "uppercase",
    },
    navLink: {
      fontFamily: "var(--font-body), 'Open Sans', sans-serif",
      fontSize: "0.75rem",
      fontWeight: 600,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
    },
    cardTitle: {
      fontFamily: "var(--font-headline), 'Outfit', sans-serif",
      fontSize: "var(--text-card-title)",
      fontWeight: 700,
      lineHeight: 1.3,
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
        containedPrimary: {
          "&:hover": {
            backgroundColor: burgundy.dark,
          },
        },
        containedSecondary: {
          color: mustard.contrastText,
          "&:hover": {
            backgroundColor: mustard.dark,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiSkeleton: {
      defaultProps: {
        animation: "pulse",
      },
      styleOverrides: {
        root: {
          backgroundColor: "rgba(229, 231, 235, 0.7)",
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
        color: "inherit",
      },
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E5E7EB",
        },
      },
    },
    MuiContainer: {
      defaultProps: {
        /* `maxWidth: false` makes MUI emit no breakpoint-derived max-width at
           all, so the root override below is the only rule in play — the
           editorial column stays 1200 no matter where `lg` sits. */
        maxWidth: false,
      },
      styleOverrides: {
        root: {
          maxWidth: CONTAINER_EDITORIAL,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        /* Dialog widths are derived from breakpoint values too, so the remap
           would shrink every modal (sm 600→480, md 900→768). styleOverrides are
           applied after the component's own variants, so these win. */
        paperWidthSm: {
          maxWidth: 600,
        },
        paperWidthMd: {
          maxWidth: 900,
        },
      },
    },
  },
});

export type MuiTheme = typeof muiTheme;

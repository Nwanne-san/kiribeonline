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
    /**
     * Every button in the app matches the header Subscribe CTA (Figma 2001:2):
     * sharp corners, Outfit, uppercase, 0.025em tracking, no shadow. Defining
     * it here rather than at each call site is what keeps them identical — a
     * `sx` override at one call site is how they drifted apart before.
     */
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        disableRipple: false,
      },
      styleOverrides: {
        root: {
          borderRadius: 0,
          fontFamily: "var(--font-headline), 'Outfit', sans-serif",
          fontWeight: 500,
          letterSpacing: "0.025em",
          textTransform: "uppercase",
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },

        /* Padding/type scale per size — mirrors the header CTA at `small`.
           These go in the *variant+size* slots, not the plain `sizeSmall`
           slot and not a nested `&.MuiButton-sizeSmall` selector:

             - MUI declares its own size+variant combinations (e.g.
               `size:'small', variant:'contained'` → `padding: '4px 10px';
               font-size: 13px`) in the component's `variants` array, so a
               plain `sizeSmall` slot is not guaranteed to win.
             - A nested `&.MuiButton-sizeSmall` under `root` *does* win, but by
               two classes of specificity — which also beats call-site `sx`.
               That silently broke every button that sets its own px/py
               (e.g. "View All Articles" rendered 24px/14px instead of its
               declared 32px/0.75rem). `sx` must always win over the theme.

           The combo slots are single-class, so they out-rank MUI's variants
           while still yielding to `sx`. Verify changes on a `contained`
           button — `text` has no competing MUI padding and looks fine either
           way. */
        containedSizeSmall: { padding: "8px 20px", fontSize: "0.875rem", lineHeight: 1.25 },
        containedSizeMedium: { padding: "10px 24px", fontSize: "0.875rem", lineHeight: 1.25 },
        containedSizeLarge: { padding: "14px 32px", fontSize: "1rem", lineHeight: 1.25 },
        outlinedSizeSmall: { padding: "7px 19px", fontSize: "0.875rem", lineHeight: 1.25 },
        outlinedSizeMedium: { padding: "9px 23px", fontSize: "0.875rem", lineHeight: 1.25 },
        outlinedSizeLarge: { padding: "13px 31px", fontSize: "1rem", lineHeight: 1.25 },
        textSizeSmall: { padding: "8px 12px", fontSize: "0.875rem", lineHeight: 1.25 },
        textSizeMedium: { padding: "10px 16px", fontSize: "0.875rem", lineHeight: 1.25 },
        textSizeLarge: { padding: "14px 20px", fontSize: "1rem", lineHeight: 1.25 },
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
          borderRadius: 0,
        },
      },
    },
    /* ── Dropdowns ────────────────────────────────────────────────────
       MUI's default select is a rounded box with a floating white paper and
       blue-grey highlight — visibly "Material", not Kiribé. These give it the
       editorial treatment: square edges, a burgundy focus ring, a hard-edged
       menu with a gold rail on the selected row. */
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundColor: "#FFFFFF",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#E5E7EB",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: burgundy.main,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: burgundy.main,
            borderWidth: 1,
          },
          "&.Mui-focused": {
            boxShadow: `0 0 0 3px ${burgundy.main}1F`,
          },
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        // The default popover animates from the selected item over the input;
        // anchoring below it reads as a dropdown rather than a floating sheet.
        MenuProps: {
          anchorOrigin: { vertical: "bottom", horizontal: "left" },
          transformOrigin: { vertical: "top", horizontal: "left" },
        },
      },
      styleOverrides: {
        select: {
          fontFamily: "var(--font-body), 'Open Sans', sans-serif",
          fontSize: "0.875rem",
        },
        icon: {
          color: "#6B7280",
          transition: "transform 150ms ease",
        },
        iconOpen: {
          transform: "rotate(180deg)",
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          border: "1px solid #E5E7EB",
          boxShadow: "0 12px 32px rgba(16, 24, 40, 0.12)",
          marginTop: 4,
        },
        list: {
          paddingTop: 0,
          paddingBottom: 0,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: "var(--font-body), 'Open Sans', sans-serif",
          fontSize: "0.875rem",
          paddingTop: 10,
          paddingBottom: 10,
          borderLeft: "3px solid transparent",
          "&:hover": {
            backgroundColor: "#FAF8F5",
            borderLeftColor: "#E5E7EB",
          },
          "&.Mui-selected": {
            backgroundColor: "#FAF8F5",
            borderLeftColor: mustard.main,
            fontWeight: 600,
            "&:hover": { backgroundColor: "#F5F1EA" },
          },
        },
      },
    },
    /* ── Dialogs ──────────────────────────────────────────────────────
       Square corners, a burgundy kicker title with the gold rule the rest of
       the site uses for section headings, and a dimmer scrim than MUI's
       default so the page behind recedes properly. */
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(12, 10, 9, 0.62)",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          position: "relative",
          fontFamily: "var(--font-headline), 'Outfit', sans-serif",
          fontSize: "0.8125rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: burgundy.main,
          padding: "20px 24px 14px",
          "&::after": {
            content: '""',
            position: "absolute",
            left: 24,
            bottom: 6,
            width: 32,
            height: 2,
            backgroundColor: mustard.main,
          },
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: "20px 24px",
          borderTop: "1px solid #E5E7EB",
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "16px 24px",
          borderTop: "1px solid #E5E7EB",
          gap: 8,
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
        /* Square corners + a defined edge and a deeper shadow, so a dialog
           reads as a deliberate surface rather than MUI's default floating
           rounded card. Dark media lightboxes opt out with `border: none`. */
        paper: {
          borderRadius: 0,
          border: "1px solid #E5E7EB",
          boxShadow: "0 24px 64px rgba(16, 24, 40, 0.24)",
        },
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

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

export const muiTheme = createTheme({
  cssVariables: true,
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
    h1: {
      fontFamily: "var(--font-headline), 'Outfit', sans-serif",
      fontWeight: 700,
    },
    h2: {
      fontFamily: "var(--font-headline), 'Outfit', sans-serif",
      fontWeight: 700,
    },
    h3: {
      fontFamily: "var(--font-headline), 'Outfit', sans-serif",
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
      fontSize: "0.75rem",
      fontWeight: 600,
      letterSpacing: "0.2em",
      textTransform: "uppercase",
    },
    sectionTitle: {
      fontFamily: "var(--font-headline), 'Outfit', sans-serif",
      fontSize: "1.75rem",
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
      fontSize: "1.25rem",
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
        maxWidth: "lg",
      },
    },
  },
});

export type MuiTheme = typeof muiTheme;

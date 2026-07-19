"use client";

import Box from "@mui/material/Box";
import type { PublicCategory } from "@/lib/content/query-categories";
import type { SiteSettings } from "@/modules/shared/types/content";
import { SiteFooter, SiteHeader } from "@/modules/shared/components/SiteHeader";
import { NavigationProgressProvider } from "@/modules/shared/components/brand";
import { SubscribeModalProvider } from "@/modules/marketing/components/SubscribeModal";
import { OfflineBanner } from "@/modules/system/components/OfflineBanner";

const MAIN_ID = "main-content";

export function SiteLayout({
  children,
  siteSettings,
  navCategories = [],
}: {
  children: React.ReactNode;
  siteSettings?: SiteSettings;
  navCategories?: PublicCategory[];
}) {
  return (
    <NavigationProgressProvider>
      <SubscribeModalProvider>
        <Box sx={{ display: "flex", minHeight: "100vh", flexDirection: "column" }}>
          {/*
            Skip-to-content link — visually hidden until keyboard focus lands
            on it. Lets keyboard/AT users bypass the header nav and jump
            straight to <main>. Rendered first in the DOM so it is the first
            focusable element on the page.
          */}
          <Box
            component="a"
            href={`#${MAIN_ID}`}
            sx={{
              position: "absolute",
              left: 8,
              top: 8,
              zIndex: 1000,
              px: 2,
              py: 1,
              borderRadius: 1,
              bgcolor: "var(--color-burgundy)",
              color: "#fff",
              fontFamily: "var(--font-headline), 'Outfit', sans-serif",
              fontSize: "0.875rem",
              fontWeight: 600,
              textDecoration: "none",
              transform: "translateY(-200%)",
              transition: "transform 120ms ease-out",
              "&:focus": {
                transform: "translateY(0)",
                outline: "2px solid var(--color-mustard)",
                outlineOffset: 2,
              },
              "&:focus-visible": {
                transform: "translateY(0)",
                outline: "2px solid var(--color-mustard)",
                outlineOffset: 2,
              },
            }}
          >
            Skip to content
          </Box>
          <SiteHeader siteSettings={siteSettings} navCategories={navCategories} />
          <OfflineBanner />
          <Box
            component="main"
            id={MAIN_ID}
            tabIndex={-1}
            className="animate-fadeIn"
            sx={{ flex: 1 }}
          >
            {children}
          </Box>
          <SiteFooter siteSettings={siteSettings} navCategories={navCategories} />
        </Box>
      </SubscribeModalProvider>
    </NavigationProgressProvider>
  );
}

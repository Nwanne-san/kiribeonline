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
        <Box className="flex min-h-screen flex-col">
          {/*
            Skip-to-content link — visually hidden until keyboard focus lands
            on it. Lets keyboard/AT users bypass the header nav and jump
            straight to <main>. Rendered first in the DOM so it is the first
            focusable element on the page.
          */}
          <Box
            component="a"
            href={`#${MAIN_ID}`}
            className="font-headline absolute top-2 left-2 z-[1000] -translate-y-[200%] rounded bg-burgundy px-4 py-2 text-sm font-semibold text-white no-underline transition-transform duration-[120ms] ease-out focus:translate-y-0 focus:outline-2 focus:outline-offset-2 focus:outline-mustard focus-visible:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mustard"
          >
            Skip to content
          </Box>
          <SiteHeader siteSettings={siteSettings} navCategories={navCategories} />
          <OfflineBanner />
          <Box
            component="main"
            id={MAIN_ID}
            tabIndex={-1}
            className="animate-fadeIn flex-1"
          >
            {children}
          </Box>
          <SiteFooter siteSettings={siteSettings} navCategories={navCategories} />
        </Box>
      </SubscribeModalProvider>
    </NavigationProgressProvider>
  );
}

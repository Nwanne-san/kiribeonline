"use client";

import Box from "@mui/material/Box";
import type { PublicCategory } from "@/lib/content/query-categories";
import type { SiteSettings } from "@/modules/shared/types/content";
import { SiteFooter, SiteHeader } from "@/modules/shared/components/SiteHeader";
import { NavigationProgressProvider } from "@/modules/shared/components/brand";
import { SubscribeModalProvider } from "@/modules/marketing/components/SubscribeModal";
import { OfflineBanner } from "@/modules/system/components/OfflineBanner";

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
          <SiteHeader siteSettings={siteSettings} navCategories={navCategories} />
          <OfflineBanner />
          <Box component="main" className="animate-fadeIn" sx={{ flex: 1 }}>
            {children}
          </Box>
          <SiteFooter siteSettings={siteSettings} navCategories={navCategories} />
        </Box>
      </SubscribeModalProvider>
    </NavigationProgressProvider>
  );
}

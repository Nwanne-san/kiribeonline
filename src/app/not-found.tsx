import type { Metadata } from "next";
import { getCategoriesForPublic, getSiteSettingsForPublic } from "@/lib/content";
import { SiteLayout } from "@/modules/shared/layouts/SiteLayout";
import { NotFoundPage } from "@/modules/system/pages/NotFoundPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default async function NotFound() {
  // The root not-found renders outside the (site) route group, so we assemble
  // the site chrome here. Each fetch degrades independently — a missing page
  // must never escalate into a 500.
  const [siteSettings, navCategories] = await Promise.all([
    getSiteSettingsForPublic().catch(() => undefined),
    getCategoriesForPublic().catch(() => []),
  ]);

  return (
    <SiteLayout siteSettings={siteSettings} navCategories={navCategories}>
      <NotFoundPage />
    </SiteLayout>
  );
}

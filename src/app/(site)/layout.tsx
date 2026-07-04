import { getCategoriesForPublic, getSiteSettingsForPublic } from "@/lib/content";
import { SiteLayout } from "@/modules/shared/layouts/SiteLayout";

export const dynamic = "force-dynamic";

export default async function SiteRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [siteSettings, navCategories] = await Promise.all([
    getSiteSettingsForPublic(),
    getCategoriesForPublic(),
  ]);
  return (
    <SiteLayout siteSettings={siteSettings} navCategories={navCategories}>
      {children}
    </SiteLayout>
  );
}
